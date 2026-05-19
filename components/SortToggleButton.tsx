import { motion } from "framer-motion";
import type { TimelineSortMode } from "@/hooks/useUniverseParams";

type SortToggleButtonProps = {
  sortMode: TimelineSortMode;
  universeColor: string;
  onToggle: () => void;
};

function ArrowUpDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7 3 0 18" />
      <path d="m3 7 4-4 4 4" />
      <path d="m17 21 0-18" />
      <path d="m21 17-4 4-4-4" />
    </svg>
  );
}

export default function SortToggleButton({
  sortMode,
  universeColor,
  onToggle,
}: SortToggleButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex h-8 items-center gap-2 rounded-full border px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[#A7A7B0] transition-colors sm:text-[11px]"
      style={{
        background: "rgba(255,255,255,0.035)",
        borderColor: `${universeColor}35`,
      }}
      aria-label={`Switch to ${sortMode === "release" ? "year" : "release"} sort`}
    >
      <ArrowUpDownIcon />
      {sortMode === "release" ? "Sort: Release Year" : "Sort: Chronological"}
    </motion.button>
  );
}