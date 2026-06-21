"use client";

import { useState } from "react";
import CardPopover from "./CardPopover";

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

const STORE_COLORS: Record<string, string> = {
  "Face to Face Games": "bg-emerald-600",
  "401 Games": "bg-blue-600",
  "Wizard's Tower": "bg-violet-600",
  "Taps Games": "bg-orange-600",
  "Hairy Tarantula": "bg-rose-600",
  "Cardboard Classics": "bg-amber-600",
  "Gamezilla": "bg-cyan-600",
  "Hobbiesville": "bg-pink-600",
  "Level Up Games": "bg-lime-600",
  "Game Knight": "bg-indigo-600",
};

export default function CardTable({
  cards,
  stores,
}: {
  cards: CardData[];
  stores: string[];
}) {
  const [sortBy, setSortBy] = useState<"score" | "price" | "name">("score");
  const [showAvail, setShowAvail] = useState<"all" | "in_stock" | "no_stock">("all");

  const filtered = cards.filter((c) => {
    if (showAvail === "in_stock") return c.store_availability.length > 0;
    if (showAvail === "no_stock") return c.store_availability.length === 0;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "score") return (b.composite_score || 0) - (a.composite_score || 0);
    if (sortBy === "price") return (a.foil_price || 0) - (b.foil_price || 0);
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
      {/* Controls */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <span className="text-slate-400 text-sm self-center mr-2">
            {cards.length} cards
          </span>
          {["score", "price", "name"].map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s as any)}
              className={`px-3 py-1 text-xs rounded-lg ${
                sortBy === s
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Sort: {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["all", "in_stock", "no_stock"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setShowAvail(f)}
              className={`px-3 py-1 text-xs rounded-lg ${
                showAvail === f
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {f === "all" ? "All" : f === "in_stock" ? "In Stock" : "No Stock"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3 font-medium">Card</th>
              <th className="text-center px-2 py-3 font-medium">Score</th>
              <th className="text-center px-2 py-3 font-medium">Target</th>
              {stores.map((s) => (
                <th key={s} className="text-center px-2 py-3 font-medium min-w-[100px]">
                  <span className={`inline-block w-2 h-2 rounded-full ${STORE_COLORS[s] || "bg-slate-600"} mr-1`} />
                  {s.split(" ")[0]}
                </th>
              ))}
              <th className="text-right px-4 py-3 font-medium">Best Deal</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((card) => {
              const bestPrice = card.best_price;
              const bestStore = card.best_store;
              const bestDisplay = bestStore && bestPrice != null;

              return (
                <tr
                  key={`${card.name}|${card.set}`}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                >
                  {/* Card Info */}
                  <td className="px-4 py-3">
                    <CardPopover
                      cardName={card.name}
                      setCode={card.set}
                      foilPrice={card.foil_price}
                      reasons={card.reasons}
                      typeLine={card.type_line}
                      rarity={card.rarity}
                      score={card.composite_score}
                    >
                      <div className="font-medium text-slate-200 cursor-pointer hover:text-purple-300 transition-colors">{card.name}</div>
                    </CardPopover>
                    <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                      <span className="text-purple-400">{card.set}</span>
                      <span>{card.rarity}</span>
                      <span className="text-slate-600">{card.type_line?.split("—")[0]?.trim()}</span>
                    </div>
                    {card.reasons && card.reasons.length > 0 && (
                      <div className="text-[10px] text-slate-600 mt-1 hidden group-hover:block">
                        {card.reasons.slice(0, 2).join(" · ")}
                      </div>
                    )}
                  </td>

                  {/* Score */}
                  <td className="text-center px-2 py-3">
                    <span className={`font-mono font-bold ${
                      (card.composite_score || 0) >= 70 ? "text-emerald-400" :
                      (card.composite_score || 0) >= 50 ? "text-amber-400" :
                      "text-slate-400"
                    }`}>
                      {card.composite_score?.toFixed(0) || "-"}
                    </span>
                  </td>

                  {/* Target Price */}
                  <td className="text-center px-2 py-3">
                    <span className="font-mono text-slate-400">
                      ${card.foil_price?.toFixed(2) || "-"}
                    </span>
                  </td>

                  {/* Store Columns */}
                  {stores.map((store) => {
                    const avail = card.store_availability?.find(
                      (a: any) => a.store === store
                    );
                    const isBest = bestDisplay && bestStore?.store === store;

                    return (
                      <td key={store} className="text-center px-2 py-3">
                        {avail ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono ${
                            isBest
                              ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700"
                              : "bg-slate-800/50 text-slate-300"
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            ${avail.price.toFixed(2)}
                            <span className="text-[10px] text-slate-500 ml-0.5">
                              {avail.variant_id ? "✓" : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-700 text-[10px]">—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Best Deal */}
                  <td className="text-right px-4 py-3">
                    {bestDisplay ? (
                      <div className="inline-block text-right">
                        <div className="text-emerald-400 font-bold font-mono">
                          ${bestPrice.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {bestStore.condition
                            ? `${bestStore.store} · ${bestStore.condition}`
                            : bestStore.store}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-700 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No cards match the current filter
        </div>
      )}
    </div>
  );
}
