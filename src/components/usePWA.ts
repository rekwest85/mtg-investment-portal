"use client";

import { useEffect, useState } from "react";

/**
 * Hook that registers the service worker and manages push notifications.
 * Polls /data/analysis.json for updates and triggers SW notifications.
 */
export default function usePWA() {
  const [registered, setRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          setRegistered(true);
          console.log("SW registered:", reg.scope);

          // Listen for messages from SW
          navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data?.type === "NEW_DATA_AVAILABLE") {
              setUpdateAvailable(true);
            }
          });
        })
        .catch((err) => console.error("SW registration failed:", err));
    }

    // Poll for data updates every 5 minutes
    let lastHash = "";
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/data/analysis.json", { cache: "no-store" });
        const text = await res.text();
        const hash = text.length.toString(); // simple change detection
        if (lastHash && hash !== lastHash) {
          setUpdateAvailable(true);
        }
        lastHash = hash;
      } catch {}
    }, 5 * 60 * 1000);

    return () => clearInterval(pollInterval);
  }, []);

  // Request notification permission
  const requestNotify = async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  };

  return { registered, updateAvailable, requestNotify };
}
