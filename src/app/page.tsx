"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CardTable from "@/components/CardTable";
import StoreSummary from "@/components/StoreSummary";
import MarketOverview from "@/components/MarketOverview";

interface CardData {
  name: string;
  set: string;
  foil_price: number;
  composite_score: number;
  rarity: string;
  type_line: string;
  reasons: string[];
  store_availability: any[];
  best_price: number | null;
  best_store: any | null;
  price_history: any;
  purchase_links: Record<string, string>;
}

// All known Canadian MTG stores we scan — show all columns even if no stock
const KNOWN_STORES = [
  "Face to Face Games", "401 Games", "Wizard's Tower",
  "Taps Games", "Hairy Tarantula", "Cardboard Classics",
  "Gamezilla", "Hobbiesville", "Level Up Games", "Game Knight",
];

interface SummaryData {
  total_cards_under_50?: number;
  total_under_5?: number;
  availability?: { total_available_listings?: number };
  meta?: { total_decks?: number; archetypes?: Record<string, [string, number][]> };
  scanned_at?: string;
}

interface ScanResult {
  name: string;
  set: string;
  foil_price: number | null;
  scryfall_uri: string | null;
  image_uri: string | null;
  rarity: string;
  type_line: string;
  stores: any[];
  total_in_stock: number;
  cheapest_price: number | null;
  cheapest_store: string | null;
  error?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [cards, setCards] = useState<CardData[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [summary, setSummary] = useState<SummaryData>({});
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  // Scan Any Card state
  const [scanSearch, setScanSearch] = useState("");
  const [scanSet, setScanSet] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showScan, setShowScan] = useState(false);

  useEffect(() => {
    (async () => {
      // Check auth
      const authRes = await fetch("/api/auth");
      const auth = await authRes.json();
      if (!auth.authenticated) {
        router.push("/login");
        return;
      }
      setAuthed(true);

      // Load data from public/ static JSON files (works on Vercel)
      const [analysisRes, availRes] = await Promise.all([
        fetch("/data/analysis.json"),
        fetch("/data/availability.json"),
      ]);
      const analysis = await analysisRes.json();
      const availability = await availRes.json();

      // Process data client-side (same logic as API route)
      const availMap: Record<string, any[]> = {};
      if (availability?.cards) {
        for (const card of availability.cards) {
          availMap[`${card.name}|${card.set || ""}`.toLowerCase()] = card.available || [];
        }
      }

      const merged: any[] = [];
      const seen = new Set<string>();
      for (const list of [
        ...(analysis?.top_picks || []),
        ...(analysis?.cheap_watchlist || []),
      ]) {
        const key = `${list.name}|${list.set || ""}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const storeData = availMap[key] || [];
        let bestStore = null;
        if (storeData.length > 0) {
          let best = storeData[0];
          for (const s of storeData) { if (s.price < best.price) best = s; }
          bestStore = best;
        }
        merged.push({ ...list, store_availability: storeData, best_price: bestStore?.price ?? null, best_store: bestStore });
      }

      // Build store list — merge known stores with any from data
      const storeNames = new Set(KNOWN_STORES);
      if (availability?.cards) {
        for (const card of availability.cards) {
          for (const hit of [...(card.available || []), ...(card.unavailable || [])]) {
            if (hit.store) storeNames.add(hit.store);
          }
        }
      }

      setCards(merged.sort((a: any, b: any) => (b.composite_score || 0) - (a.composite_score || 0)));
      setStores(Array.from(storeNames));
      setSummary({
        ...(analysis?.summary || {}),
        availability: availability?.summary || {},
        scanned_at: availability?.scanned_at || null,
      });
      setLoading(false);
    })();
  }, [router]);

  const handleScanCard = async () => {
    if (!scanSearch.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const params = new URLSearchParams({ name: scanSearch.trim() });
      if (scanSet.trim()) params.set("set", scanSet.trim().toUpperCase());
      const res = await fetch(`/api/scan-card?${params}`);
      const data = await res.json();
      setScanResult(data);
    } catch (err) {
      console.error("Scan error", err);
    }
    setScanning(false);
  };

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              ⚔️ MTG Investment Portal
            </h1>
            <p className="text-xs text-slate-500">
              Pre-Modern Foil Command Centre
              {summary.scanned_at && (
                <span className="ml-2">
                  · Last scan: {new Date(summary.scanned_at).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowScan(!showScan)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              showScan
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            🔍 Scan Card
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
          </div>
        ) : (
          <>
            {/* Scan Any Card Section */}
            {showScan && (
              <div className="bg-slate-900/80 border border-purple-800/50 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-200">🔍 Scan Any Card</h2>
                  <span className="text-[10px] text-slate-500">Real-time search across all 10 stores</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Card name (e.g., 'Force of Will')"
                    value={scanSearch}
                    onChange={(e) => setScanSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScanCard()}
                    className="flex-1 min-w-[200px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Set code (opt)"
                    value={scanSet}
                    onChange={(e) => setScanSet(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleScanCard()}
                    className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 uppercase"
                  />
                  <button
                    onClick={handleScanCard}
                    disabled={scanning || !scanSearch.trim()}
                    className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                  >
                    {scanning ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                        Scanning...
                      </span>
                    ) : (
                      "Scan"
                    )}
                  </button>
                </div>

                {/* Scan Results */}
                {scanResult && !scanResult.error && (
                  <div className="bg-slate-800/50 rounded-lg p-3 space-y-3">
                    {/* Card Header */}
                    <div className="flex items-start gap-3">
                      {scanResult.image_uri && (
                        <img
                          src={scanResult.image_uri}
                          alt={scanResult.name}
                          className="w-16 h-auto rounded-md hidden sm:block"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-sm">{scanResult.name}</span>
                          <span className="text-[10px] text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full">
                            {scanResult.set}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {scanResult.type_line} · {scanResult.rarity}
                          {scanResult.foil_price && (
                            <span className="ml-2 text-emerald-400">${scanResult.foil_price.toFixed(2)} foil</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {scanResult.total_in_stock > 0 ? (
                            <span className="text-green-400">
                              ✅ {scanResult.total_in_stock} store{scanResult.total_in_stock !== 1 ? "s" : ""} in stock
                              · From ${scanResult.cheapest_price?.toFixed(2)} at {scanResult.cheapest_store}
                            </span>
                          ) : (
                            <span className="text-slate-500">❌ No stock found at any store</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Store Results */}
                    {scanResult.stores && scanResult.stores.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {scanResult.stores.map((store: any, i: number) => (
                          <a
                            key={i}
                            href={store.product_url || store.cart_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-700/50 rounded-lg px-3 py-2 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${store.available ? "bg-green-400" : "bg-yellow-400"}`} />
                              <span className="text-xs text-slate-300 font-medium">{store.store.split(" ")[0]}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-emerald-400 font-bold">${store.price.toFixed(2)}</span>
                              {store.quantity > 1 && (
                                <span className="text-[9px] text-slate-500 bg-slate-800 px-1 py-0.5 rounded">×{store.quantity}</span>
                              )}
                              {store.condition && <span className="text-[9px] text-slate-600">{store.condition}</span>}
                              <span className="text-[9px] text-slate-500">↗</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {scanResult?.error && (
                  <div className="text-xs text-red-400 bg-red-900/20 rounded-lg px-3 py-2">
                    {scanResult.error}
                  </div>
                )}
              </div>
            )}

            {/* Market Overview */}
            <MarketOverview summary={summary} stores={stores} />

            {/* Store Summary Cards */}
            {cards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stores.map((store) => {
                  const storeCards = cards.filter(
                    (c) => c.best_store?.store === store
                  );
                  if (storeCards.length === 0) return null;
                  const total = storeCards.reduce(
                    (sum, c) => sum + (c.best_store?.price || 0),
                    0
                  );
                  return (
                    <StoreSummary
                      key={store}
                      name={store}
                      count={storeCards.length}
                      total={total}
                    />
                  );
                })}
              </div>
            )}

            {/* Card Table */}
            <CardTable cards={cards} stores={stores} />
          </>
        )}
      </main>
    </div>
  );
}
