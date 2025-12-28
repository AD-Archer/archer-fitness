"use client";

import { init } from "@plausible-analytics/tracker";
import { useEffect } from "react";

export function PlausibleAnalytics() {
  useEffect(() => {
    init({
      domain: "fitness.adarcher.app",
      endpoint: "https://plausible.adarcher.app/api/event",
      formSubmissions: true,
      outboundLinks: true,
    });
  }, []);

  return null;
}
