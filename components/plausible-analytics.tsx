"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface PlausibleFunction {
    (eventName: string, options?: Record<string, unknown>): void;
    q?: unknown[][];
  }

  interface Window {
    plausible?: PlausibleFunction;
  }
}

const PLAUSIBLE_SCRIPT_ID = "plausible-analytics-script";
const PLAUSIBLE_SRC = "https://plausible.adarcher.app/js/script.js";

type PlausibleAnalyticsProps = {
  domain: string;
};

export function PlausibleAnalytics({ domain }: PlausibleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasTrackedInitialPageview = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    window.plausible =
      window.plausible ||
      function queueEvent(...args: unknown[]) {
        const queuedEvents = window.plausible?.q || [];
        queuedEvents.push(args);

        if (window.plausible) {
          window.plausible.q = queuedEvents;
        }
      };

    if (document.getElementById(PLAUSIBLE_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement("script");
    script.id = PLAUSIBLE_SCRIPT_ID;
    script.defer = true;
    script.dataset.domain = domain;
    script.src = PLAUSIBLE_SRC;
    document.head.appendChild(script);
  }, [domain]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!pathname) {
      return;
    }

    if (!hasTrackedInitialPageview.current) {
      hasTrackedInitialPageview.current = true;
      return;
    }

    const search = searchParams.toString();
    const url = search ? `${pathname}?${search}` : pathname;

    window.plausible?.("pageview", { u: url });
  }, [pathname, searchParams]);

  return null;
}
