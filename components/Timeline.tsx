import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import MovieCard from "@/components/MovieCard";
import type { PhaseColorMap, TimelineMovie } from "@/types";

type TimelineProps = {
  movies: TimelineMovie[];
  universeColor: string;
  phaseColors: PhaseColorMap;
};

export default function Timeline({
  movies,
  universeColor,
  phaseColors,
}: TimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const phaseLegend = useMemo(
    () => [...new Set(movies.map((movie) => movie.phase))],
    [movies],
  );

  return (
    <section>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.035 } },
        }}
        className="relative"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="absolute left-4 top-0 bottom-0 w-px -translate-x-1/2 md:left-1/2"
          style={{
            background: `linear-gradient(to bottom, transparent, ${universeColor}40 10%, ${universeColor}40 90%, transparent)`,
          }}
        />

        {movies.map((movie, index) => {
          const isLeft = index % 2 === 0;
          const isHovered = hoveredIndex === index;
          const phaseColor = phaseColors[movie.phase] ?? "#888888";

          return (
            <motion.div
              key={`${movie.title}-${index}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0 },
              }}
              className="relative mb-3 pl-9 md:pl-0"
            >
              <motion.div
                animate={{
                  width: isHovered ? 14 : 9,
                  height: isHovered ? 14 : 9,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute left-4 top-1/2 z-10 h-2.25 w-2.25 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all md:left-1/2"
                style={{
                  background: isHovered ? universeColor : `${universeColor}80`,
                  boxShadow: isHovered
                    ? `0 0 16px ${universeColor}, 0 0 32px ${universeColor}60`
                    : "none",
                }}
              />

              <div
                className={`w-full md:w-1/2 ${
                  isLeft ? "md:pr-8" : "md:ml-auto md:pl-10 lg:pl-11"
                }`}
              >
                <MovieCard
                  movie={movie}
                  index={index}
                  isHovered={isHovered}
                  isLeft={isLeft}
                  universeColor={universeColor}
                  phaseColor={phaseColor}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45 }}
        className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-3 border-t border-white/5 pt-8"
      >
        {phaseLegend.map((phase) => {
          const phaseColor = phaseColors[phase] ?? "#888888";
          return (
            <motion.div
              key={phase}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="flex items-center gap-2 font-mono text-[11px] text-[#777777]"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  background: phaseColor,
                  boxShadow: `0 0 6px ${phaseColor}`,
                }}
              />
              {phase}
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
