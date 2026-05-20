import { getStore } from "@netlify/blobs";

type HandlerEvent = {
  queryStringParameters?: {
    title?: string;
    imdbId?: string;
  } | null;
};

type HandlerResponse = {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
};

type OmdbResponse = {
  Poster?: string;
  Title?: string;
  Year?: string;
  imdbID?: string;
  Response?: string;
};

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=86400",
};

function jsonResponse(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  };
}

function getPosterValue(poster: string | undefined) {
  if (!poster || poster === "N/A") {
    return null;
  }

  return poster;
}

export async function handler(event: HandlerEvent): Promise<HandlerResponse> {
  const apiKey = process.env.OMDB_API_KEY;
  const title = event.queryStringParameters?.title?.trim();
  const imdbId = event.queryStringParameters?.imdbId?.trim();

  if (!apiKey) {
    return jsonResponse(500, { error: "OMDB_API_KEY is not configured" });
  }

  if (!title && !imdbId) {
    return jsonResponse(400, { error: "Provide title or imdbId" });
  }

  // Cache key based on what we're looking up
  const cacheKey = imdbId ? `imdb-${imdbId}` : `title-${title}`;
  const store = getStore("omdb-cache");

  // Check cache first
  const cached = await store.get(cacheKey, { type: "json" });
  if (cached) {
    return jsonResponse(200, cached);
  }

  // Not in cache — fetch from OMDB
  const searchParams = new URLSearchParams({ apikey: apiKey });
  if (imdbId) {
    searchParams.set("i", imdbId);
  } else if (title) {
    searchParams.set("t", title);
  }

  try {
    const response = await fetch(`https://www.omdbapi.com/?${searchParams}`);

    if (!response.ok) {
      return jsonResponse(response.status, { error: "OMDB request failed" });
    }

    const data = (await response.json()) as OmdbResponse;

    if (data.Response === "False") {
      return jsonResponse(404, {
        poster: null,
        title: title ?? "",
        year: "",
        imdbID: imdbId ?? "",
      });
    }

    const result = {
      poster: getPosterValue(data.Poster),
      title: data.Title ?? title ?? "",
      year: data.Year ?? "",
      imdbID: data.imdbID ?? imdbId ?? "",
    };

    // Store in cache — no expiry, movie data doesn't change
    await store.set(cacheKey, JSON.stringify(result));

    return jsonResponse(200, result);
  } catch {
    return jsonResponse(502, {
      error: "Unable to reach OMDB",
      poster: null,
      title: title ?? "",
      year: "",
      imdbID: imdbId ?? "",
    });
  }
}