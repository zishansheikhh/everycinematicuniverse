"use client";

import { useMemo } from "react";

type Star = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
};

function createSeededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function createStars(count: number, seed = 12345): Star[] {
  const random = createSeededRandom(seed);

  return Array.from({ length: count }, () => ({
    x: random() * 100,
    y: random() * 100,
    size: random() * 1.5 + 0.3,
    opacity: random() * 0.4 + 0.1,
    duration: random() * 4 + 3,
    delay: random() * 4,
  }));
}

export default function StarField() {
  const stars = useMemo(() => createStars(80), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      {stars.map((star, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animation: `twinkle ${star.duration}s ease-in-out infinite alternate`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
