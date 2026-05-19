import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TimelineUniverse, TimelineUniverseKey } from "@/types";

type UniverseSwitcherProps = {
  universeEntries: [TimelineUniverseKey, TimelineUniverse][];
  activeUniverse: TimelineUniverseKey;
  onSelect: (key: TimelineUniverseKey) => void;
};

const MOBILE_VISIBLE_LIMIT = 15;

export default function UniverseSwitcher({
  universeEntries,
  activeUniverse,
  onSelect,
}: UniverseSwitcherProps) {
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);

  const mobileEntries = useMemo(
    () =>
      isExpandedMobile
        ? universeEntries
        : universeEntries.slice(0, MOBILE_VISIBLE_LIMIT),
    [isExpandedMobile, universeEntries],
  );

  const shouldShowMoreButton = universeEntries.length > MOBILE_VISIBLE_LIMIT;

  return (
    <section className="mb-8 sm:mb-10">
      <motion.div
        layout
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex flex-wrap items-center justify-center gap-2 sm:hidden"
      >
        <AnimatePresence mode="popLayout">
          {mobileEntries.map(([key, universe], index) => {
            const isActive = activeUniverse === key;

            return (
              <motion.button
                layout
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -8 }}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  delay: index * 0.015,
                  type: "spring",
                  stiffness: 280,
                  damping: 22,
                }}
                className="rounded-full border px-3 py-2 text-[11px] tracking-[0.08em]"
                style={{
                  background: isActive
                    ? `${universe.color}18`
                    : "rgba(255,255,255,0.03)",
                  borderColor: isActive
                    ? `${universe.color}80`
                    : "rgba(255,255,255,0.08)",
                  color: isActive ? universe.color : "#888888",
                  boxShadow: isActive ? `0 0 20px ${universe.color}25` : "none",
                }}
              >
                {universe.icon} {universe.label}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <motion.div
        layout
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="hidden flex-wrap items-center justify-center gap-2 sm:flex"
      >
        <AnimatePresence mode="popLayout">
          {universeEntries.map(([key, universe], index) => {
            const isActive = activeUniverse === key;

            return (
              <motion.button
                layout
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -8 }}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  delay: index * 0.012,
                  type: "spring",
                  stiffness: 280,
                  damping: 22,
                }}
                className="rounded-full border px-3 py-2 text-[11px] tracking-[0.08em] sm:px-5 sm:text-xs"
                style={{
                  background: isActive
                    ? `${universe.color}18`
                    : "rgba(255,255,255,0.03)",
                  borderColor: isActive
                    ? `${universe.color}80`
                    : "rgba(255,255,255,0.08)",
                  color: isActive ? universe.color : "#888888",
                  boxShadow: isActive ? `0 0 20px ${universe.color}25` : "none",
                }}
              >
                {universe.icon} {universe.label}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {shouldShowMoreButton ? (
        <div className="mt-3 flex justify-center sm:hidden">
          <motion.button
            type="button"
            onClick={() => setIsExpandedMobile((value) => !value)}
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-mono text-[11px] tracking-[0.08em] text-[#A7A7B0]"
          >
            {isExpandedMobile ? "LESS UNIVERSES" : "MORE UNIVERSES"}
          </motion.button>
        </div>
      ) : null}
    </section>
  );
}
