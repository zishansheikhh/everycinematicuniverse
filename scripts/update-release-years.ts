import * as fs from "node:fs";
import * as path from "node:path";
import ts from "typescript";

type MovieEntry = {
  universeKey: string;
  universeLabel: string;
  title: string;
  releaseYear: string;
  releaseYearNode: import("typescript").StringLiteralLike;
};

type OmdbResponse = {
  Title?: unknown;
  Year?: unknown;
  Response?: unknown;
};

type Replacement = {
  start: number;
  end: number;
  value: string;
};

const dataFilePath = path.resolve(process.cwd(), "data", "universes.ts");
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const universeArg = args
  .find((arg: string) => arg.startsWith("--universe="))
  ?.slice("--universe=".length)
  .trim()
  .toLowerCase();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPropertyName(name: import("typescript").PropertyName) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return null;
}

function getObjectProperty(
  objectLiteral: import("typescript").ObjectLiteralExpression,
  propertyName: string,
) {
  return objectLiteral.properties.find((property): property is import("typescript").PropertyAssignment => {
    if (!ts.isPropertyAssignment(property)) {
      return false;
    }

    return getPropertyName(property.name) === propertyName;
  });
}

function getStringProperty(
  objectLiteral: import("typescript").ObjectLiteralExpression,
  propertyName: string,
) {
  const property = getObjectProperty(objectLiteral, propertyName);

  if (!property || !ts.isStringLiteralLike(property.initializer)) {
    return null;
  }

  return property.initializer;
}

function getUniversesObject(sourceFile: import("typescript").SourceFile) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === "universes" &&
        declaration.initializer &&
        ts.isObjectLiteralExpression(declaration.initializer)
      ) {
        return declaration.initializer;
      }
    }
  }

  return null;
}

function collectMovies(sourceFile: import("typescript").SourceFile) {
  const universesObject = getUniversesObject(sourceFile);
  const movies: MovieEntry[] = [];

  if (!universesObject) {
    throw new Error("Could not find exported universes object");
  }

  for (const universeProperty of universesObject.properties) {
    if (!ts.isPropertyAssignment(universeProperty)) {
      continue;
    }

    const universeKey = getPropertyName(universeProperty.name);

    if (!universeKey || !ts.isObjectLiteralExpression(universeProperty.initializer)) {
      continue;
    }

    const universeObject = universeProperty.initializer;
    const label = getStringProperty(universeObject, "label")?.text ?? universeKey;
    const normalizedUniverseArg = universeArg ?? "";

    if (
      universeArg &&
      universeKey.toLowerCase() !== normalizedUniverseArg &&
      label.toLowerCase() !== normalizedUniverseArg
    ) {
      continue;
    }

    const moviesProperty = getObjectProperty(universeObject, "movies");

    if (!moviesProperty || !ts.isArrayLiteralExpression(moviesProperty.initializer)) {
      continue;
    }

    for (const movieNode of moviesProperty.initializer.elements) {
      if (!ts.isObjectLiteralExpression(movieNode)) {
        continue;
      }

      const titleNode = getStringProperty(movieNode, "title");
      const releaseYearNode = getStringProperty(movieNode, "releaseYear");

      if (!titleNode || !releaseYearNode) {
        continue;
      }

      movies.push({
        universeKey,
        universeLabel: label,
        title: titleNode.text,
        releaseYear: releaseYearNode.text,
        releaseYearNode,
      });
    }
  }

  return movies;
}

function getReleaseYearFromOmdb(data: OmdbResponse) {
  if (data.Response === "False" || typeof data.Year !== "string") {
    return null;
  }

  const match = data.Year.match(/\d{4}/);
  return match ? match[0] : null;
}

async function fetchReleaseYear(title: string, apiKey: string) {
  const searchParams = new URLSearchParams({
    apikey: apiKey,
    t: title,
  });

  const response = await fetch(`https://www.omdbapi.com/?${searchParams}`);

  if (!response.ok) {
    throw new Error(`OMDB request failed with ${response.status}`);
  }

  return getReleaseYearFromOmdb((await response.json()) as OmdbResponse);
}

function createReplacement(
  sourceText: string,
  node: import("typescript").StringLiteralLike,
  nextYear: string,
) {
  const currentText = sourceText.slice(node.getStart(), node.getEnd());
  const quote = currentText.startsWith("'") ? "'" : '"';

  return {
    start: node.getStart() + 1,
    end: node.getEnd() - 1,
    value: nextYear.replaceAll(quote, `\\${quote}`),
  };
}

function applyReplacements(sourceText: string, replacements: Replacement[]) {
  return replacements
    .sort((left, right) => right.start - left.start)
    .reduce(
      (nextText, replacement) =>
        `${nextText.slice(0, replacement.start)}${replacement.value}${nextText.slice(
          replacement.end,
        )}`,
      sourceText,
    );
}

async function main() {
  const apiKey = process.env.OMDB_API_KEY;

  if (!apiKey) {
    throw new Error("OMDB_API_KEY is required");
  }

  const sourceText = fs.readFileSync(dataFilePath, "utf8");
  const sourceFile = ts.createSourceFile(
    dataFilePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
  );
  const movies = collectMovies(sourceFile);
  const replacements: Replacement[] = [];

  if (universeArg && movies.length === 0) {
    console.log(`[SKIP] Universe "${universeArg}" was not found`);
    return;
  }

  for (const movie of movies) {
    try {
      const fetchedYear = await fetchReleaseYear(movie.title, apiKey);

      if (!fetchedYear) {
        console.log(`[SKIP] Title: "${movie.title}" not found on OMDB`);
      } else if (fetchedYear !== movie.releaseYear) {
        console.log(
          `[UPDATED] Title: "${movie.title}" ${movie.releaseYear} -> ${fetchedYear}`,
        );
        replacements.push(createReplacement(sourceText, movie.releaseYearNode, fetchedYear));
      } else {
        console.log(`[OK] Title: "${movie.title}" year unchanged`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.log(`[SKIP] Title: "${movie.title}" ${message}`);
    }

    await delay(200);
  }

  if (isDryRun) {
    console.log(`[DRY RUN] ${replacements.length} change(s) detected`);
    return;
  }

  if (replacements.length === 0) {
    console.log("[DONE] No releaseYear changes needed");
    return;
  }

  fs.writeFileSync(dataFilePath, applyReplacements(sourceText, replacements));
  console.log(`[DONE] Wrote ${replacements.length} releaseYear update(s)`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[ERROR] ${message}`);
  process.exitCode = 1;
});
