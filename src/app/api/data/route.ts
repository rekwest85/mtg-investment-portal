import { NextResponse } from "next/server";

const DATA_BASE = process.cwd() + "/public/data";

function loadJSON(name: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    const p = `${DATA_BASE}/${name}`;
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf-8"));
    return null;
  } catch { return null; }
}

export async function GET() {
  try {
    const analysis = loadJSON("analysis.json");
    const availability = loadJSON("availability.json");
    const history = loadJSON("price_history.json");
    const meta = loadJSON("meta.json");

    const availMap: Record<string, any[]> = {};
    if (availability?.cards) {
      for (const card of availability.cards) {
        availMap[`${card.name}|${card.set || ""}`.toLowerCase()] = card.available || [];
      }
    }

    const historyMap: Record<string, any> = {};
    if (history?.cards) {
      for (const hc of history.cards) {
        historyMap[hc.name.toLowerCase()] = hc;
      }
    }

    const cards: any[] = [];
    const seenCards = new Set<string>();

    for (const list of [
      ...(analysis?.top_picks || []),
      ...(analysis?.cheap_watchlist || []),
    ]) {
      const key = `${list.name}|${list.set || ""}`.toLowerCase();
      if (seenCards.has(key)) continue;
      seenCards.add(key);

      const storeData = availMap[key] || [];
      let bestStore = null;
      if (storeData.length > 0) {
        let best = storeData[0];
        for (const s of storeData) { if (s.price < best.price) best = s; }
        bestStore = best;
      }

      cards.push({
        ...list,
        store_availability: storeData,
        price_history: historyMap[list.name.toLowerCase()] || null,
        best_price: bestStore?.price ?? null,
        best_store: bestStore,
      });
    }

    const storeNames = new Set<string>();
    if (availability?.cards) {
      for (const card of availability.cards) {
        for (const hit of [...(card.available || []), ...(card.unavailable || [])]) {
          storeNames.add(hit.store);
        }
      }
    }

    return NextResponse.json({
      cards: cards.sort((a: any, b: any) => (b.composite_score || 0) - (a.composite_score || 0)),
      stores: Array.from(storeNames),
      store_carts: availability?.store_carts || [],
      summary: {
        total_cards_under_50: analysis?.summary?.total_cards_under_50,
        total_under_5: analysis?.summary?.total_under_5,
        availability: availability?.summary || {},
        meta: meta ? { total_decks: meta.total_decks, archetypes: meta.archetypes ? Object.fromEntries(Object.entries(meta.archetypes).map(([k, v]) => [k, (v as any[]).slice(0, 5)])) : null } : null,
        scanned_at: availability?.scanned_at || null,
      },
    });
  } catch (error: any) {
    console.error("Data API error:", error?.message || String(error));
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
