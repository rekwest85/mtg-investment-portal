"use client";

import { useState } from "react";
import CardPopover from "./CardPopover";
import PriceChart from "./PriceChart";

interface CardData {
  name: string;
  set: string;
  foil_price: number;
  foil_price_cad: number;
  cad_rate: number;
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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = cards.filter((c) => {
    if (showAvail === "in_stock") return c.store_availability.length > 0;
    if (showAvail === "no_stock") return c.store_availability.length === 0;
    return true;
  }).filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.set.toLowerCase().includes(q) ||
      c.type_line?.toLowerCase().includes(q) ||
      (c.rarity && c.rarity.toLowerCase().includes(q))
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "score") return (b.composite_score || 0) - (a.composite_score || 0);
    if (sortBy === "price") return (a.foil_price || 0) - (b.foil_price || 0);
    return a.name.localeCompare(b.name);
  });

  const toggleExpand = (key: string) => {
    setExpandedCard((prev) => (prev === key ? null : key));
  };

  // Get unique quantities per card per store
  const getQuantity = (card: CardData, store: string): number | null => {
    const avail = card.store_availability?.find((a: any) => a.store === store);
    return avail?.quantity ?? null;
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
      {/* Controls */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search cards, sets, types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-colors"
          />
        </div>
        {/* Sort */}
        <div className="flex gap-2">
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
        {/* Filter */}
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

      {/* Results count */}
      <div className="px-4 py-2 text-xs text-slate-600 border-b border-slate-800/50">
        {filtered.length} of {cards.length} cards
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-sm" style={{ minWidth: `${stores.length * 110 + 320}px` }}>
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
              <th className="text-left px-3 py-3 font-medium sticky left-0 z-10 bg-slate-900/95 backdrop-blur min-w-[140px] max-w-[200px]">
                Card
              </th>
              <th className="text-center px-1 py-3 font-medium w-12">Scr</th>
              <th className="text-center px-1 py-3 font-medium w-16">Target</th>
              {stores.map((s) => (
                <th key={s} className="text-center px-1 py-3 font-medium min-w-[100px]">
                  <span className={`inline-block w-2 h-2 rounded-full ${STORE_COLORS[s] || "bg-slate-600"} mr-1`} />
                  {s.split(" ")[0]}
                </th>
              ))}
              <th className="text-right px-3 py-3 font-medium min-w-[100px]">Best Deal</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((card) => {
              const bestPrice = card.best_price;
              const bestStore = card.best_store;
              const bestDisplay = bestStore && bestPrice != null;
              const cardKey = `${card.name}|${card.set}`;
              const isExpanded = expandedCard === cardKey;

              return (
                <tr
                  key={cardKey}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group cursor-pointer ${
                    isExpanded ? "bg-slate-800/40" : ""
                  }`}
                  onClick={() => toggleExpand(cardKey)}
                >
                  {/* Card Info — STICKY */}
                  <td className="px-3 py-3 sticky left-0 z-[5] bg-slate-950 group-hover:bg-slate-900/70 transition-colors border-r border-slate-800/30">
                    <div className="max-w-[140px]">
                      <CardPopover
                        cardName={card.name}
                        setCode={card.set}
                        foilPrice={card.foil_price}
                        foilPriceCad={card.foil_price_cad}
                        reasons={card.reasons}
                        typeLine={card.type_line}
                        rarity={card.rarity}
                        score={card.composite_score}
                      >
                        <div className="font-medium text-slate-200 cursor-pointer hover:text-purple-300 transition-colors text-xs sm:text-sm truncate">
                          {card.name}
                        </div>
                      </CardPopover>
                      <div className="text-[10px] text-slate-500 flex gap-1.5 mt-0.5 truncate">
                        <span className="text-purple-400">{card.set}</span>
                        <span>{card.rarity}</span>
                      </div>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="text-center px-1 py-3">
                    <span className={`font-mono font-bold text-xs ${
                      (card.composite_score || 0) >= 70 ? "text-emerald-400" :
                      (card.composite_score || 0) >= 50 ? "text-amber-400" :
                      "text-slate-400"
                    }`}>
                      {card.composite_score?.toFixed(0) || "-"}
                    </span>
                  </td>

                  {/* Target Price (CAD) */}
                  <td className="text-center px-1 py-3">
                    <div className="font-mono text-slate-400 text-xs">
                      ${card.foil_price_cad?.toFixed(2) || card.foil_price?.toFixed(2) || "-"}
                    </div>
                    <div className="text-[8px] text-slate-600">CAD</div>
                  </td>

                  {/* Store Columns with Buy Links + Quantity */}
                  {stores.map((store) => {
                    const avail = card.store_availability?.find(
                      (a: any) => a.store === store
                    );
                    const isBest = bestDisplay && bestStore?.store === store;
                    const qty = getQuantity(card, store);

                    return (
                      <td key={store} className="text-center px-1 py-3">
                        {avail ? (
                          <a
                            href={avail.product_url || avail.cart_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors ${
                              isBest
                                ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700 hover:bg-emerald-800/50"
                                : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${avail.available ? "bg-green-400" : "bg-yellow-400"}`} />
                            ${avail.price.toFixed(2)}
                            {qty !== null && qty > 1 && (
                              <span className="text-[9px] text-slate-500 ml-0.5 bg-slate-800 px-1 py-0.5 rounded">
                                ×{qty}
                              </span>
                            )}
                            <span className="text-[9px] text-slate-500">↗</span>
                          </a>
                        ) : (
                          <span className="text-slate-700 text-[10px]">—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Best Deal */}
                  <td className="text-right px-3 py-3">
                    {bestDisplay ? (
                      <a
                        href={bestStore.product_url || bestStore.cart_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-block text-right hover:opacity-80 transition-opacity"
                      >
                        <div className="text-emerald-400 font-bold font-mono text-xs">
                          ${bestPrice.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {bestStore.condition
                            ? `${bestStore.store.split(" ")[0]} · ${bestStore.condition}`
                            : bestStore.store.split(" ")[0]}
                        </div>
                      </a>
                    ) : (
                      <span className="text-slate-700 text-xs">—</span>
                    )}
                  </td>
                </tr>
                {/* Expanded Price Chart Row */}
                {isExpanded && (
                  <tr key={`${cardKey}-chart`} className="border-b border-slate-800/50">
                    <td colSpan={stores.length + 4} className="bg-slate-900/60 p-4">
                      <div className="max-w-2xl mx-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-300">
                            📈 Price History — {card.name}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(cardKey); }}
                            className="text-xs text-slate-500 hover:text-slate-300"
                          >
                            Close ✕
                          </button>
                        </div>
                        {card.price_history ? (
                          <PriceChart
                            priceHistory={card.price_history}
                            currentPrice={card.foil_price}
                          />
                        ) : (
                          <div className="text-xs text-slate-500 text-center py-3">
                            Price history data will accumulate after future scans
                          </div>
                        )}
                        {/* Buy links for each store */}
                        {card.store_availability.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-800/50">
                            <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">Buy From</div>
                            <div className="flex flex-wrap gap-2">
                              {card.store_availability.map((avail: any, i: number) => {
                                const storeColor = avail.store === "Face to Face Games" ? "bg-emerald-600/10" :
                                  avail.store === "401 Games" ? "bg-blue-600/10" :
                                  avail.store === "Game Knight" ? "bg-indigo-600/10" :
                                  avail.store === "Gamezilla" ? "bg-cyan-600/10" :
                                  avail.store === "Hairy Tarantula" ? "bg-rose-600/10" :
                                  avail.store === "Cardboard Classics" ? "bg-amber-600/10" :
                                  avail.store === "Level Up Games" ? "bg-lime-600/10" :
                                  "bg-slate-800/50";
                                return (
                                  <a
                                    key={i}
                                    href={avail.product_url || avail.cart_url || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${storeColor} text-slate-300 hover:text-white`}
                                  >
                                    {avail.store.split(" ")[0]}
                                    <span className="font-mono">${avail.price.toFixed(2)}</span>
                                    {avail.quantity > 1 && <span className="text-[9px] text-slate-500">×{avail.quantity}</span>}
                                    <span className="text-[9px]">↗</span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          {searchQuery ? (
            <span>No cards match "<strong>{searchQuery}</strong>"</span>
          ) : (
            <span>No cards match the current filter</span>
          )}
        </div>
      )}
    </div>
  );
}
