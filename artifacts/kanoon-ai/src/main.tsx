import { createRoot } from "react-dom/client";
import posthog from "posthog-js";
import App from "./App";
import "./index.css";
const PH_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
if (PH_KEY) {
  posthog.init(PH_KEY, {
    api_host: "https://app.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    persistence: "localStorage",
    loaded(ph) {
      if (import.meta.env.DEV) ph.opt_out_capturing();
    },
  });
}

export function trackEvent(event: string, props?: Record<string, unknown>) {
  if (PH_KEY) posthog.capture(event, props);
}

createRoot(document.getElementById("root")!).render(<App />);
