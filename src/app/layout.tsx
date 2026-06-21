import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWAInitializer from "@/components/PWAInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MTG Investment Portal",
  description: "Canadian MTG Pre-Modern Foil Investment Command Centre",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MTG Portal",
    startupImage: ["/icons/icon-512.png"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-touch-fullscreen": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MTG Portal" />
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen`}>
        <PWAInitializer />
        {children}
      </body>
    </html>
  );
}
