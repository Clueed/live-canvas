import { useCallback, useRef, useState } from "react";

import type { Part } from "@google/generative-ai";

// Simple string hashing function (djb2 algorithm)
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }

  return String(hash >>> 0);
}

const formatCanvas = (canvasText: string): Part => {
  return {
    text: `The user has updated the canvas to:\n\`\`\`\n${canvasText}\n\`\`\``,
  };
};

export type UseManagedCanvasResult = {
  canvasText: string;
  updateCanvasText: (newText: string, isUserUpdate: boolean) => void;
  getOptionalCanvasPart: () => Part | null;
};

/**
 * Hook to manage the canvas text state and prepare the canvas Part for sending.
 * It tracks the text content, its hash, and whether the last update was by the user.
 * It tracks the text content and the hash of the last *sent* content.
 * It only prepares the Part for sending if the current text hash differs
 * from the last sent hash. AI updates directly update the last sent hash
 * to prevent sending them later.
 */
export function useManagedCanvas(): UseManagedCanvasResult {
  const [canvasText, setCanvasText] = useState<string>("");
  const lastSentHashSentToServer = useRef<string>(hashString(""));

  const updateCanvasText = useCallback(
    (newText: string, isUserUpdate: boolean) => {
      setCanvasText(newText);

      if (!isUserUpdate) {
        const newHash = hashString(newText);
        if (newHash !== lastSentHashSentToServer.current) {
          console.log(
            `Canvas text updated by AI. Updating last sent hash to: ${newHash}`,
          );
          lastSentHashSentToServer.current = newHash;
        }
      }
    },
    [],
  );

  const getOptionalCanvasPart = useCallback((): Part | null => {
    const currentHash = hashString(canvasText);

    if (currentHash === lastSentHashSentToServer.current) {
      return null;
    }

    console.log(
      `Canvas text changed by user (new hash: ${currentHash}). Preparing part.`,
    );
    lastSentHashSentToServer.current = currentHash;

    return formatCanvas(canvasText);
  }, [canvasText]);

  return {
    canvasText,
    updateCanvasText,
    getOptionalCanvasPart,
  };
}
