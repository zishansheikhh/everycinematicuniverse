"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { TimelineMovie } from "@/types";

type MovieCardProps = {
  movie: TimelineMovie;
  index: number;
  isHovered: boolean;
  isLeft: boolean;
  universeColor: string;
  phaseColor: string;
};

function withAlpha(hexColor: string, alpha: string) {
  return `${hexColor}${alpha}`;
}

type PosterState = {
  cacheKey: string;
  poster: string | null;
  isLoading: boolean;
};

type OmdbPosterResponse = {
  poster: string | null;
  title: string;
  year: string;
  imdbID: string;
};

const fallbackPoster = "/film.png";
const posterCache = new Map<string, string | null>();

function getPosterCacheKey(movie: TimelineMovie) {
  return movie.imdbID ? `id:${movie.imdbID}` : `title:${movie.title}`;
}

export default function MovieCard({
  movie,
  index,
  isHovered,
  isLeft,
  universeColor,
  phaseColor,
}: MovieCardProps) {
  const posterCacheKey = getPosterCacheKey(movie);
  const [posterState, setPosterState] = useState<PosterState>(() => {
    const cachedPoster = posterCache.get(posterCacheKey);
    return {
      cacheKey: posterCacheKey,
      poster: cachedPoster ?? null,
      isLoading: cachedPoster === undefined,
    };
  });
  const isPosterLoading =
    posterState.cacheKey !== posterCacheKey || posterState.isLoading;
  const posterSrc =
    posterState.cacheKey === posterCacheKey ? posterState.poster : null;

  useEffect(() => {
    let isCurrent = true;
    const cacheKey = getPosterCacheKey(movie);
    const cachedPoster = posterCache.get(cacheKey);

    if (cachedPoster !== undefined) {
      queueMicrotask(() => {
        if (isCurrent) {
          setPosterState({ cacheKey, poster: cachedPoster, isLoading: false });
        }
      });
      return () => {
        isCurrent = false;
      };
    }

    const abortController = new AbortController();
    const searchParam = movie.imdbID
      ? `imdbId=${encodeURIComponent(movie.imdbID)}`
      : `title=${encodeURIComponent(movie.title)}`;

    fetch(`/.netlify/functions/omdb-poster?${searchParam}`, {
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`OMDB poster request failed: ${response.status}`);
        }

        return (await response.json()) as OmdbPosterResponse;
      })
      .then((data) => {
        const nextPoster = data.poster || null;
        posterCache.set(cacheKey, nextPoster);
        setPosterState({ cacheKey, poster: nextPoster, isLoading: false });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        posterCache.set(cacheKey, null);
        setPosterState({ cacheKey, poster: null, isLoading: false });
      });

    return () => abortController.abort();
  }, [movie]);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="relative w-full rounded-xl border p-4 transition duration-200 sm:p-5 md:max-w-100"
      style={{
        background: isHovered
          ? "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)"
          : "rgba(255,255,255,0.025)",
        borderColor: isHovered
          ? withAlpha(universeColor, "50")
          : "rgba(255,255,255,0.07)",
        transform: isHovered ? "scale(1.01)" : "scale(1)",
        boxShadow: isHovered
          ? `0 8px 40px ${withAlpha(universeColor, "15")}`
          : "none",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border shadow-lg sm:h-18 sm:w-18"
            style={{
              borderColor: withAlpha(universeColor, "25"),
              background: "rgba(255,255,255,0.035)",
              boxShadow: `0 8px 22px ${withAlpha(universeColor, "10")}`,
            }}
          >
            {isPosterLoading ? (
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                }}
              />
            ) : null}
            <img
              src={posterSrc ?? fallbackPoster}
              alt={movie.title}
              loading="lazy"
              className="h-full w-full object-cover"
              onError={(event) => {
                if (event.currentTarget.src.endsWith(fallbackPoster)) {
                  return;
                }

                posterCache.set(getPosterCacheKey(movie), null);
                event.currentTarget.src = fallbackPoster;
              }}
            />
          </div>

          <div className="min-w-0">
            <h3
              className="mb-1 text-sm font-semibold tracking-[-0.01em] sm:text-[15px]"
              style={{ color: isHovered ? "#FFFFFF" : "#D0D0E0" }}
            >
              {movie.title}
            </h3>
            <p className="font-mono text-[10px] tracking-wider text-[#666666] sm:text-[11px]">
              {movie.note}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p
            className="mb-1 font-mono text-[10px] opacity-80 sm:text-[11px]"
            style={{ color: universeColor }}
          >
            {movie.year}
          </p>
          <span
            className="inline-block whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]"
            style={{
              background: withAlpha(phaseColor, "15"),
              borderColor: withAlpha(phaseColor, "40"),
              color: phaseColor,
            }}
          >
            {movie.phase}
          </span>
        </div>
      </div>

      <div
        className="absolute top-1/2 hidden h-5.5 w-5.5 -translate-y-1/2 items-center justify-center rounded-full border bg-[#0A0A14] font-mono text-[9px] md:flex"
        style={{
          borderColor: withAlpha(universeColor, "30"),
          color: withAlpha(universeColor, "80"),
          right: isLeft ? "-38px" : undefined,
          left: isLeft ? undefined : "-30px",
        }}
      >
        {index + 1}
      </div>
    </motion.div>
  );
}
