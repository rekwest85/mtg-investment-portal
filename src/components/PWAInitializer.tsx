"use client";

import { useEffect } from "react";

export default function PWAInitializer() {
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator && "Notification" in window) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("PWA: SW registered"))
        .catch(() => {});

      // Request notification permission on first visit
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  return null;
}
