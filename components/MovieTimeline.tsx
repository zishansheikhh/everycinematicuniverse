"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import StarField from "@/components/StarField";
import SortToggleButton from "@/components/SortToggleButton";
import Timeline from "@/components/Timeline";
import Toast from "@/components/Toast";
import UniverseSwitcher from "@/components/UniverseSwitcher";
import { phaseColors, universes } from "@/data/universes";
import { slugify, useUniverseParams } from "@/hooks/useUniverseParams";
import type { TimelineUniverseKey } from "@/types";
import Link from "next/link";

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4.5 w-4.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98" />
      <path d="m15.41 6.51-6.82 3.98" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-3 w-3 shrink-0 transition-transform duration-200"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function MovieTimeline() {
  const [movieSearchTerm, setMovieSearchTerm] = useState("");
  const [universeSearchTerm, setUniverseSearchTerm] = useState("");
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isShareHovered, setIsShareHovered] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [isPhaseOpen, setIsPhaseOpen] = useState(false);
  const phaseDropdownRef = useRef<HTMLDivElement>(null);

  const universeEntries = useMemo(
    () =>
      Object.entries(universes) as [
        TimelineUniverseKey,
        (typeof universes)[TimelineUniverseKey],
      ][],
    [],
  );
  const universeKeys = useMemo(
    () => universeEntries.map(([key]) => key),
    [universeEntries],
  );
  const {
    universe: activeUniverse,
    phase: activePhaseSlug,
    sort: sortMode,
    setUniverse,
    setPhase,
    setSort,
  } = useUniverseParams(universeKeys);

  const universe = universes[activeUniverse];
  const phaseOptions = useMemo(
    () =>
      [...new Set(universe.movies.map((movie) => movie.phase))].map(
        (phase) => ({
          label: phase,
          slug: slugify(phase),
        }),
      ),
    [universe.movies],
  );
  const selectedPhase = phaseOptions.find(
    (phase) => phase.slug === activePhaseSlug,
  );
  const filteredUniverseEntries = useMemo(() => {
    const search = universeSearchTerm.trim().toLowerCase();
    if (!search) {
      return universeEntries;
    }

    return universeEntries.filter(([key, timelineUniverse]) => {
      return (
        timelineUniverse.label.toLowerCase().includes(search) ||
        timelineUniverse.icon.toLowerCase().includes(search) ||
        key.toLowerCase().includes(search)
      );
    });
  }, [universeEntries, universeSearchTerm]);

  const filteredMovies = useMemo(() => {
    const search = movieSearchTerm.trim().toLowerCase();

    const nextMovies = universe.movies.filter((movie) => {
      const matchesSearch =
        !search || movie.title.toLowerCase().includes(search);
      const matchesPhase =
        !selectedPhase || slugify(movie.phase) === selectedPhase.slug;

      return matchesSearch && matchesPhase;
    });

    if (sortMode !== "release") {
      return nextMovies;
    }

    return [...nextMovies].sort((firstMovie, secondMovie) => {
      const firstYear = Number.parseInt(firstMovie.releaseYear, 10);
      const secondYear = Number.parseInt(secondMovie.releaseYear, 10);

      if (Number.isNaN(firstYear) && Number.isNaN(secondYear)) {
        return 0;
      }

      if (Number.isNaN(firstYear)) {
        return 1;
      }

      if (Number.isNaN(secondYear)) {
        return -1;
      }

      return firstYear - secondYear;
    });
  }, [movieSearchTerm, selectedPhase, sortMode, universe.movies]);

  function handleUniverseChange(nextUniverse: TimelineUniverseKey) {
    setUniverse(nextUniverse);
  }

  function handleUniverseSearchChange(searchValue: string) {
    setUniverseSearchTerm(searchValue);

    const search = searchValue.trim().toLowerCase();
    if (!search) {
      return;
    }

    if (universes[activeUniverse].label.toLowerCase().includes(search)) {
      return;
    }

    const firstMatch = universeEntries.find(([key, timelineUniverse]) => {
      return (
        timelineUniverse.label.toLowerCase().includes(search) ||
        timelineUniverse.icon.toLowerCase().includes(search) ||
        key.toLowerCase().includes(search)
      );
    });

    if (firstMatch) {
      setUniverse(firstMatch[0]);
    }
  }

  function showToast() {
    setToastVisible(true);
  }

  async function handleShare() {
    const url = window.location.href;
    const title = `${universe.label} - Cinematic Universe Tracker`;
    const text = universe.description ?? title;

    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    showToast();
  }

  function handleSortToggle() {
    setSort(sortMode === "release" ? "year" : "release");
  }

  // Close phase dropdown on outside click
  useEffect(() => {
    if (!isPhaseOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        phaseDropdownRef.current &&
        !phaseDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPhaseOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isPhaseOpen]);

  // Close phase dropdown on Escape
  useEffect(() => {
    if (!isPhaseOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsPhaseOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPhaseOpen]);

  useEffect(() => {
    if (!isInfoOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsInfoOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isInfoOpen]);

  useEffect(() => {
    if (activePhaseSlug && !selectedPhase) {
      setPhase(null);
    }
  }, [activePhaseSlug, selectedPhase, setPhase]);

  useEffect(() => {
    if (!toastVisible) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastVisible(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [toastVisible]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative min-h-screen overflow-hidden px-4 pb-16 sm:px-6 sm:pb-20"
      style={{
        background: "#080810",
        color: "#E8E8F0",
        fontFamily: "Georgia, Times New Roman, serif",
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(30,10,60,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(10,30,60,0.3) 0%, transparent 50%)",
        }}
      />
      <StarField />

      <main className="relative z-10 mx-auto w-full max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="px-2 py-12 text-center sm:py-14"
        >
          {/* Sub Header */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-[#888888] sm:text-[11px]"
          >
            Cinematic Universe Timelines
          </motion.p>
          {/* Site Title */}
          <motion.h1
            key={activeUniverse}
            initial={{ opacity: 0.15, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="m-0 text-[clamp(2.2rem,7vw,4.5rem)] leading-[1.05] tracking-[-0.02em] transition-all duration-500"
            style={{
              color: universe.color,
              textShadow: `0 0 60px ${universe.color}50, 0 0 120px ${universe.color}20`,
              fontWeight: 400,
            }}
          >
            Every Cinematic Universe
          </motion.h1>

          {/* Info Button */}
          <motion.button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            whileHover={{ y: -1, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mx-auto mt-5 flex h-8 w-8 items-center justify-center rounded-full border font-mono text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080810]"
            style={{
              borderColor: `${universe.color}55`,
              color: universe.color,
              background: "rgba(255,255,255,0.03)",
            }}
            aria-label="Open information about this site"
          >
            i
          </motion.button>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="relative mx-auto mb-6 max-w-md"
        >
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-[#666666]">
            UV
          </span>
          <input
            type="text"
            value={universeSearchTerm}
            onChange={(event) => handleUniverseSearchChange(event.target.value)}
            placeholder="Search universes..."
            className="w-full rounded-lg border py-2.5 pr-4 pl-10 font-mono text-xs text-[#E8E8F0] outline-none transition-colors sm:text-sm"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: `${universe.color}35`,
              boxShadow: `0 0 0 1px ${universe.color}10`,
            }}
          />
        </motion.div>

        <UniverseSwitcher
          universeEntries={filteredUniverseEntries}
          activeUniverse={activeUniverse}
          onSelect={handleUniverseChange}
        />

        {/* Not Found */}
        {filteredUniverseEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="-mt-4 mb-8 text-center font-mono text-xs tracking-[0.08em] text-[#666666]"
          >
            No universes found for &quot;{universeSearchTerm}&quot;
          </motion.div>
        ) : null}

        <motion.div
          key={`${activeUniverse}-movie-search`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45 }}
          className="relative mx-auto mb-10 max-w-md"
        >
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-[#666666]">
            SR
          </span>
          <input
            type="text"
            value={movieSearchTerm}
            onChange={(event) => setMovieSearchTerm(event.target.value)}
            placeholder="Search movies..."
            className="w-full rounded-lg border py-2.5 pr-4 pl-10 font-mono text-xs text-[#E8E8F0] outline-none transition-colors sm:text-sm"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: `${universe.color}30`,
              boxShadow: `0 0 0 1px ${universe.color}10`,
            }}
          />
        </motion.div>
        <motion.div
          key={`${activeUniverse}-share-row`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="mx-auto mt-3 flex max-w-2xl items-center justify-center gap-3"
        >
          <h2
            className="m-0 text-lg leading-tight tracking-[-0.01em] text-[#D7D7E2] sm:text-2xl"
            style={{ fontWeight: 400 }}
          >
            {universe.label}
          </h2>
          <button
            type="button"
            onClick={() => {
              void handleShare();
            }}
            onMouseEnter={() => setIsShareHovered(true)}
            onMouseLeave={() => setIsShareHovered(false)}
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080810]"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: isShareHovered
                ? `${universe.color}70`
                : "rgba(255,255,255,0.08)",
              color: isShareHovered ? universe.color : "#858592",
            }}
            aria-label={`Share ${universe.label}`}
          >
            <ShareIcon />
          </button>
        </motion.div>

        {/* Universe description */}
        <motion.p
          key={`${activeUniverse}-description`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 text-center font-mono text-xs tracking-[0.08em] text-[#666666] sm:text-sm"
        >
          {universe.description}
        </motion.p>
        <br />

        {/* Phase dropdown + sort row */}
        <motion.div
          key={`${activeUniverse}-toolbar`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          {/* Custom Phase Dropdown */}
          <div className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#777777] sm:text-[11px]">
            <span className="shrink-0">Phase</span>

            <div ref={phaseDropdownRef} className="relative min-w-0">
              {/* Trigger */}
              <button
                type="button"
                onClick={() => setIsPhaseOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isPhaseOpen}
                aria-label="Filter by phase"
                className="flex h-8 items-center gap-2 rounded-full border px-3 font-mono text-[10px] uppercase tracking-[0.08em] outline-none transition-all duration-200 sm:text-[11px]"
                style={{
                  background: "rgba(255,255,255,0.035)",
                  borderColor: isPhaseOpen
                    ? `${universe.color}70`
                    : `${universe.color}35`,
                  boxShadow: isPhaseOpen
                    ? `0 0 10px ${universe.color}30, 0 0 22px ${universe.color}15`
                    : `0 0 0 1px ${universe.color}10`,
                  color: selectedPhase ? universe.color : "#D0D0E0",
                }}
              >
                <span className="max-w-32.5 truncate">
                  {selectedPhase?.label ?? "All phases"}
                </span>
                <ChevronDownIcon open={isPhaseOpen} />
              </button>

              {/* Panel */}
              <AnimatePresence>
                {isPhaseOpen && (
                  <motion.ul
                    role="listbox"
                    aria-label="Phase options"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-40 overflow-hidden rounded-xl border py-1"
                    style={{
                      background:
                        "linear-gradient(160deg, rgba(16,16,32,0.97) 0%, rgba(10,10,22,0.97) 100%)",
                      borderColor: `${universe.color}40`,
                      boxShadow: `0 0 0 1px ${universe.color}15, 0 8px 32px rgba(0,0,0,0.6), 0 0 28px ${universe.color}20`,
                      backdropFilter: "blur(14px)",
                    }}
                  >
                    {/* All phases */}
                    {[{ label: "All phases", slug: "" }, ...phaseOptions].map(
                      (phase) => {
                        const isActive =
                          phase.slug === ""
                            ? !selectedPhase
                            : selectedPhase?.slug === phase.slug;
                        return (
                          <li
                            key={phase.slug || "__all__"}
                            role="option"
                            aria-selected={isActive}
                            onClick={() => {
                              setPhase(phase.slug || null);
                              setIsPhaseOpen(false);
                            }}
                            className="flex cursor-pointer items-center gap-2 px-3 py-1.75 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors duration-100 sm:text-[11px]"
                            style={{
                              color: isActive ? universe.color : "#9A9AAA",
                              background: isActive
                                ? `${universe.color}13`
                                : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive)
                                (
                                  e.currentTarget as HTMLElement
                                ).style.background = `${universe.color}09`;
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive)
                                (
                                  e.currentTarget as HTMLElement
                                ).style.background = "transparent";
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full transition-opacity duration-150"
                              style={{
                                background: universe.color,
                                opacity: isActive ? 1 : 0,
                              }}
                            />
                            {phase.label}
                          </li>
                        );
                      },
                    )}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex justify-end">
            <SortToggleButton
              sortMode={sortMode}
              universeColor={universe.color}
              onToggle={handleSortToggle}
            />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {filteredMovies.length > 0 ? (
            <motion.div
              key={`${activeUniverse}-results`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <Timeline
                movies={filteredMovies}
                universeColor={universe.color}
                phaseColors={phaseColors}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`${activeUniverse}-empty`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pt-6 text-center font-mono text-sm text-[#555555]"
            >
              No results for &quot;
              {movieSearchTerm || selectedPhase?.label || "current filters"}
              &quot;
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pre Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-8 text-center font-mono text-[11px] tracking-widest text-[#333333] sm:mt-10"
        >
          {universe.movies.length} FILMS - CHRONOLOGICAL ORDER
        </motion.footer>
      </main>

      {/* Site Info */}
      <AnimatePresence>
        {isInfoOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-[2px] sm:px-6"
            onClick={() => setIsInfoOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="site-about-title"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="relative w-full max-w-lg rounded-2xl border p-5 text-left shadow-2xl sm:p-6"
              style={{
                background:
                  "linear-gradient(160deg, rgba(16,16,30,0.96) 0%, rgba(11,11,20,0.96) 100%)",
                borderColor: `${universe.color}45`,
                boxShadow: `0 15px 70px ${universe.color}26`,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border font-mono text-sm text-[#BEBED0] transition-colors hover:text-white"
                style={{
                  borderColor: "rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.04)",
                }}
                aria-label="Close information popup"
              >
                x
              </button>

              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8A8A9A]">
                About This Site
              </p>
              <h2
                id="site-about-title"
                className="mt-2 text-2xl leading-tight tracking-[-0.02em] sm:text-[1.8rem]"
                style={{ color: universe.color }}
              >
                Built for fans, by a fellow developer
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#D6D6E0] sm:text-[15px]">
                Every Cinematic Universe is made with care for people who love
                story order, world-building, and movie marathons.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#CACADA] sm:text-[15px]">
                No cookies. No trackers. No ads. Just clean timelines, fast
                browsing, and respect for your privacy.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#BABACB] sm:text-[15px]">
                This is a passion project and always will be free. If it helps
                you relive a favorite universe or discover a new one, that means
                everything.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#ef9359] sm:text-[15px]">
                <Link href="https://github.com/zishansheikhh">Github link</Link>
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <Toast isVisible={toastVisible} message="Copied!" />
    </motion.div>
  );
}