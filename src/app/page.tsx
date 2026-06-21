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

export default function Dashboard() {
  const router = useRouter();
  const [cards, setCards] = useState<CardData[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [summary, setSummary] = useState<SummaryData>({});
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

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
