import { NextResponse } from "next/server";
import { getOmdbMovie } from "@/lib/omdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cacheableResponseHeaders = {
  "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
};

const uncacheableResponseHeaders = {
  "Cache-Control": "no-store",
};

export async function GET(request: Request) {
  const apiKey = process.env.OMDB_API_KEY;
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim();
  const imdbId = searchParams.get("imdbId")?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { error: "OMDB_API_KEY is not configured" },
      { status: 500, headers: uncacheableResponseHeaders },
    );
  }

  if (!title && !imdbId) {
    return NextResponse.json(
      { error: "Provide title or imdbId" },
      { status: 400, headers: uncacheableResponseHeaders },
    );
  }

  try {
    const result = await getOmdbMovie({ title, imdbId }, apiKey);
    const { isFound, ...body } = result;

    return NextResponse.json(body, {
      status: isFound ? 200 : 404,
      headers: isFound ? cacheableResponseHeaders : uncacheableResponseHeaders,
    });
  } catch (error) {
    console.error("Unable to reach OMDB", { title, imdbId, error });

    return NextResponse.json(
      {
        error: "Unable to reach OMDB",
        poster: null,
        title: title ?? "",
        year: "",
        imdbID: imdbId ?? "",
      },
      { status: 502, headers: uncacheableResponseHeaders },
    );
  }
}
