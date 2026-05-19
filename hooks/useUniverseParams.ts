import { useCallback, useEffect, useState } from "react";
import type { TimelineUniverseKey } from "@/types";

export type TimelineSortMode = "year" | "release";

type UniverseParams = {
  universe: TimelineUniverseKey;
  phase: string | null;
  sort: TimelineSortMode;
};

type UpdateOptions = {
  universe?: TimelineUniverseKey;
  phase?: string | null;
  sort?: TimelineSortMode;
};

const defaultParams: UniverseParams = {
  universe: "mcu",
  phase: null,
  sort: "year",
};

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isTimelineUniverseKey(
  value: string | null,
  universeKeys: TimelineUniverseKey[],
): value is TimelineUniverseKey {
  return value !== null && universeKeys.includes(value as TimelineUniverseKey);
}

function readParams(universeKeys: TimelineUniverseKey[]): UniverseParams {
  if (typeof window === "undefined") {
    return defaultParams;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const universeParam = searchParams.get("universe");
  const sortParam = searchParams.get("sort");

  return {
    universe: isTimelineUniverseKey(universeParam, universeKeys)
      ? universeParam
      : defaultParams.universe,
    phase: searchParams.get("phase"),
    sort: sortParam === "release" ? "release" : "year",
  };
}

function writeParams(params: UniverseParams) {
  const searchParams = new URLSearchParams(window.location.search);

  searchParams.set("universe", params.universe);

  if (params.phase) {
    searchParams.set("phase", params.phase);
  } else {
    searchParams.delete("phase");
  }

  if (params.sort === "release") {
    searchParams.set("sort", "release");
  } else {
    searchParams.delete("sort");
  }

  const nextSearch = searchParams.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;

  window.history.replaceState(null, "", nextUrl);
}

export function useUniverseParams(universeKeys: TimelineUniverseKey[]) {
  const [params, setParams] = useState<UniverseParams>(() => readParams(universeKeys));

  const updateParams = useCallback((updates: UpdateOptions) => {
    setParams((currentParams) => {
      const nextParams = {
        ...currentParams,
        ...updates,
      };

      if (typeof window !== "undefined") {
        writeParams(nextParams);
      }

      return nextParams;
    });
  }, []);

  useEffect(() => {
    function handlePopState() {
      setParams(readParams(universeKeys));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [universeKeys]);

  const setUniverse = useCallback(
    (universe: TimelineUniverseKey) => updateParams({ universe, phase: null }),
    [updateParams],
  );
  const setPhase = useCallback(
    (phase: string | null) => updateParams({ phase }),
    [updateParams],
  );
  const setSort = useCallback(
    (sort: TimelineSortMode) => updateParams({ sort }),
    [updateParams],
  );

  return {
    ...params,
    setUniverse,
    setPhase,
    setSort,
  };
}
