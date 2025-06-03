"use client";

import { LiveCanvasView } from "@/components/app/LiveCanvasView";
import { LiveAPIProvider } from "@/contexts/LiveAPIContext";
import type { LiveClientOptions } from "@/lib/live-ai-client/multimodal-live-types";

const API_KEY = process.env.NEXT_PUBLIC_GCP_API_KEY;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

export default function Page() {
  return (
    <LiveAPIProvider options={apiOptions}>
      <LiveCanvasView />
    </LiveAPIProvider>
  );
}
