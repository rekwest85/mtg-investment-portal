import { NextResponse } from "next/server";
import path from "path";

const LOCAL_DIR = "C:\\Users\\boss\\AppData\\Local\\hermes\\cron\\output\\mtg_bot";

function tryRead(filePath: string | null) {
  if (!filePath) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs") as typeof import("fs");
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function findDataFile(name: string): string | null {
  const repoDir = path.join(process.cwd(), "data");
  const localPath = path.join(LOCAL_DIR, name);
  const repoPath = path.join(repoDir, name);
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs") as typeof import("fs");
    if (fs.existsSync(localPath)) return localPath;
    if (fs.existsSync(repoPath)) return repoPath;
  } catch {
    // Ignore
  }
  return null;
}

export async function GET() {
  try {
    const analysis = tryRead(findDataFile("analysis.json"));
    const availability = tryRead(findDataFile("availability.json"));
    const history = tryRead(findDataFile("price_history.json"));
    const meta = tryRead(findDataFile("meta.json"));

    // Build store availability map
    const availMap: Record<string, any[]> = {};
    if (availability?.cards) {
      for (const card of availability.cards) {
        const key = `${card.name}|${card.set || ""}`.toLowerCase();
        availMap[key] = card.available || [];
      }
    }

    // Build history map
    const historyMap: Record<string, any> = {};
    if (history?.cards) {
      for (const hc of history.cards) {
        historyMap[hc.name.toLowerCase()] = hc;
      }
    }

    // Merge all card data
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
      const histData = historyMap[list.name.toLowerCase()];
      let bestStore = null;
      if (storeData.length > 0) {
        let best = storeData[0];
        for (const s of storeData) {
          if (s.price < best.price) best = s;
        }
        bestStore = best;
      }

      cards.push({
        ...list,
        store_availability: storeData,
        price_history: histData,
        best_price: bestStore?.price ?? null,
        best_store: bestStore,
      });
    }

    // Build store list
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
        meta: meta
          ? {
              total_decks: meta.total_decks,
              archetypes: meta.archetypes
                ? Object.fromEntries(
                    Object.entries(meta.archetypes).map(([k, v]) => [
                      k,
                      (v as any[]).slice(0, 5),
                    ])
                  )
                : null,
            }
          : null,
        scanned_at: availability?.scanned_at || null,
      },
    });
  } catch (error: any) {
    console.error("Data API error:", error?.message || String(error));
    return NextResponse.json(
      { error: "Failed to load data" },
      { status: 500 }
    );
  }
}
