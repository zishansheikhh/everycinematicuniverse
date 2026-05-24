import * as fs from "node:fs/promises";
import * as path from "node:path";

export type OmdbLookupInput = {
  title?: string;
  imdbId?: string;
};

export type OmdbLookupResult = {
  poster: string | null;
  title: string;
  year: string;
  imdbID: string;
  isFound: boolean;
};

type OmdbResponse = {
  Poster?: unknown;
  Title?: unknown;
  Year?: unknown;
  imdbID?: unknown;
  Response?: unknown;
};

type CacheEntry = {
  cachedAt: string;
  value: OmdbLookupResult;
};

type CacheFile = {
  version: 1;
  entries: Record<string, CacheEntry>;
};

const cacheVersion = 1;
const defaultCacheTtlSeconds = 60 * 60 * 24 * 365;
const inflightRequests = new Map<string, Promise<OmdbLookupResult>>();
let cacheWriteQueue = Promise.resolve();

function getCacheFilePath() {
  return process.env.OMDB_CACHE_FILE || ".cache/omdb-cache.json";
}

function getCacheTtlSeconds() {
  const rawValue = process.env.OMDB_CACHE_TTL_SECONDS;
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : defaultCacheTtlSeconds;

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : defaultCacheTtlSeconds;
}

export function getOmdbCacheKey(input: OmdbLookupInput) {
  if (input.imdbId?.trim()) {
    return `imdb:${input.imdbId.trim().toLowerCase()}`;
  }

  if (input.title?.trim()) {
    return `title:${input.title.trim().toLowerCase()}`;
  }

  throw new Error("Provide title or imdbId");
}

function getPosterValue(poster: unknown) {
  if (typeof poster !== "string" || poster === "N/A") {
    return null;
  }

  return poster;
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeOmdbResponse(data: OmdbResponse, input: OmdbLookupInput): OmdbLookupResult {
  if (data.Response === "False") {
    return {
      poster: null,
      title: input.title ?? "",
      year: "",
      imdbID: input.imdbId ?? "",
      isFound: false,
    };
  }

  return {
    poster: getPosterValue(data.Poster),
    title: getStringValue(data.Title) || input.title || "",
    year: getStringValue(data.Year),
    imdbID: getStringValue(data.imdbID) || input.imdbId || "",
    isFound: true,
  };
}

async function readCache(): Promise<CacheFile> {
  try {
    const cacheText = await fs.readFile(/* turbopackIgnore: true */ getCacheFilePath(), "utf8");
    const cache = JSON.parse(cacheText) as CacheFile;

    if (cache.version !== cacheVersion || !cache.entries) {
      return { version: cacheVersion, entries: {} };
    }

    return cache;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return { version: cacheVersion, entries: {} };
    }

    if (error instanceof SyntaxError) {
      const cacheFilePath = getCacheFilePath();
      const backupPath = `${cacheFilePath}.corrupt-${Date.now()}`;

      try {
        await fs.rename(
          /* turbopackIgnore: true */ cacheFilePath,
          /* turbopackIgnore: true */ backupPath,
        );
      } catch {
        // If the backup fails, still let OMDB recover instead of bricking every lookup.
      }

      return { version: cacheVersion, entries: {} };
    }

    throw error;
  }
}

async function writeCache(cache: CacheFile) {
  const cacheFilePath = getCacheFilePath();
  const cacheDirectory = path.dirname(cacheFilePath);
  const temporaryPath = `${cacheFilePath}.${process.pid}.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2)}.tmp`;

  await fs.mkdir(/* turbopackIgnore: true */ cacheDirectory, { recursive: true });
  await fs.writeFile(
    /* turbopackIgnore: true */ temporaryPath,
    `${JSON.stringify(cache, null, 2)}\n`,
    "utf8",
  );
  await fs.rename(
    /* turbopackIgnore: true */ temporaryPath,
    /* turbopackIgnore: true */ cacheFilePath,
  );
}

async function getCachedValue(cacheKey: string) {
  const cache = await readCache();
  const entry = cache.entries[cacheKey];

  if (!entry) {
    return null;
  }

  const cachedAt = Date.parse(entry.cachedAt);
  const ageSeconds = (Date.now() - cachedAt) / 1000;

  if (!Number.isFinite(cachedAt) || ageSeconds > getCacheTtlSeconds()) {
    return null;
  }

  return entry.value;
}

async function setCachedValue(cacheKey: string, value: OmdbLookupResult) {
  cacheWriteQueue = cacheWriteQueue
    .catch(() => undefined)
    .then(async () => {
      const cache = await readCache();

      cache.entries[cacheKey] = {
        cachedAt: new Date().toISOString(),
        value,
      };

      await writeCache(cache);
    });

  await cacheWriteQueue;
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchFromOmdbOnce(input: OmdbLookupInput, apiKey: string) {
  const searchParams = new URLSearchParams({ apikey: apiKey });

  if (input.imdbId?.trim()) {
    searchParams.set("i", input.imdbId.trim());
  } else if (input.title?.trim()) {
    searchParams.set("t", input.title.trim());
  } else {
    throw new Error("Provide title or imdbId");
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 8000);

  const response = await fetch(`https://www.omdbapi.com/?${searchParams}`, {
    signal: abortController.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    throw new Error(`OMDB request failed with ${response.status}`);
  }

  return normalizeOmdbResponse((await response.json()) as OmdbResponse, input);
}

async function fetchFromOmdb(input: OmdbLookupInput, apiKey: string) {
  const retryDelays = [250, 750];
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      return await fetchFromOmdbOnce(input, apiKey);
    } catch (error) {
      lastError = error;

      if (attempt < retryDelays.length) {
        await sleep(retryDelays[attempt]);
      }
    }
  }

  throw lastError;
}

export async function getOmdbMovie(input: OmdbLookupInput, apiKey: string) {
  const cacheKey = getOmdbCacheKey(input);
  const cachedValue = await getCachedValue(cacheKey);

  if (cachedValue) {
    return cachedValue;
  }

  const existingRequest = inflightRequests.get(cacheKey);

  if (existingRequest) {
    return existingRequest;
  }

  const nextRequest = fetchFromOmdb(input, apiKey).then(async (result) => {
    await setCachedValue(cacheKey, result);
    return result;
  });

  inflightRequests.set(cacheKey, nextRequest);

  try {
    return await nextRequest;
  } finally {
    inflightRequests.delete(cacheKey);
  }
}

export function getReleaseYearFromOmdbResult(result: OmdbLookupResult) {
  const match = result.year.match(/\d{4}/);
  return match ? match[0] : null;
}
