"use client";

import React, { useEffect, useState } from "react";

interface ScrambleNumberProps {
  value: number;
  padLength?: number;
  className?: string;
}

const HEX_CHARS = "0123456789ABCDEF";

/**
 * Efecto de desencriptación táctica cyberpunk para contadores numéricos HUD.
 */
export function ScrambleNumber({
  value,
  padLength = 2,
  className = "",
}: ScrambleNumberProps) {
  const targetStr = value.toString().padStart(padLength, "0");
  const [display, setDisplay] = useState(targetStr);

  useEffect(() => {
    let iteration = 0;
    const maxIterations = 14;
    const interval = setInterval(() => {
      setDisplay(
        targetStr
          .split("")
          .map((char, index) => {
            if (index < iteration / 3) {
              return char;
            }
            return HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
          })
          .join("")
      );

      iteration++;
      if (iteration >= maxIterations) {
        setDisplay(targetStr);
        clearInterval(interval);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [value, padLength, targetStr]);

  return <span className={className}>{display}</span>;
}
