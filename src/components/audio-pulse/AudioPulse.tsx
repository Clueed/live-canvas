"use client";

import React, { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

// Assuming cn utility is available

const lineCount = 3;

export type AudioPulseProps = {
  active: boolean;
  volume: number;
  hover?: boolean;
};

export default function AudioPulse({ active, volume, hover }: AudioPulseProps) {
  const linesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let timeoutId: number | null = null;

    const updateLineHeights = () => {
      linesRef.current.forEach((line, i) => {
        if (line) {
          // Calculate height based on volume, ensuring a minimum height
          // Adjust multipliers as needed for visual sensitivity
          const baseHeight = 2; // Minimum height in px
          const maxHeight = 16; // Maximum height in px
          const volumeMultiplier = i === 1 ? 100 : 40; // Center line more sensitive
          let height = baseHeight + volume * volumeMultiplier;
          height = Math.min(maxHeight, Math.max(baseHeight, height)); // Clamp height
          line.style.height = `${height}px`;
        }
      });

      // Only schedule next update if the component is active
      if (active) {
        timeoutId = window.setTimeout(updateLineHeights, 100); // Update interval
      }
    };

    if (active) {
      updateLineHeights(); // Initial update if active
    } else {
      // Reset heights when inactive
      linesRef.current.forEach((line) => {
        if (line) {
          line.style.height = "2px"; // Reset to minimum height
        }
      });
    }

    // Cleanup function
    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [volume, active]); // Rerun effect if volume or active state changes

  return (
    <div
      className={cn(
        "flex h-5 w-5 items-end justify-center gap-px overflow-hidden", // Basic layout
        hover && "opacity-80", // Example hover effect
      )}
      title={`Volume: ${volume.toFixed(2)}`} // Add a title for accessibility/info
    >
      {Array(lineCount)
        .fill(null)
        .map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              linesRef.current[i] = el;
            }} // Explicitly return nothing
            className={cn(
              "transition-height w-1 rounded-full bg-current duration-100 ease-linear", // Styling for lines
              active ? "opacity-100" : "opacity-30", // Dim lines when inactive
              // Removed SCSS-based animation, relying on height transition
            )}
            style={{
              height: "2px", // Initial height
              // animationDelay: `${i * 133}ms` // Removed animation delay
            }}
          />
        ))}
    </div>
  );
}
