interface SummaryProps {
  summary: {
    total_cards_under_50?: number;
    total_under_5?: number;
    availability?: {
      total_available_listings?: number;
      total_cards_scanned?: number;
    };
    meta?: {
      total_decks?: number;
      archetypes?: Record<string, [string, number][]>;
    };
    scanned_at?: string;
  };
  stores: string[];
}

export default function MarketOverview({ summary, stores }: SummaryProps) {
  const availSummary = summary.availability || {};
  const meta = summary.meta;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-200 mb-4">📊 Market Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Card Counts */}
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Analyzed</div>
          <div className="text-2xl font-bold text-slate-100">
            {summary.total_cards_under_50 || 0}
          </div>
          <div className="text-xs text-slate-600">pre-modern foils under $50</div>
        </div>

        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Under $5 Watchlist</div>
          <div className="text-2xl font-bold text-emerald-400">
            {summary.total_under_5 || 0}
          </div>
          <div className="text-xs text-slate-600">cheap sleepers</div>
        </div>

        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Available to Buy</div>
          <div className="text-2xl font-bold text-cyan-400">
            {availSummary.total_available_listings || 0}
          </div>
          <div className="text-xs text-slate-600">across {stores.length} stores</div>
        </div>

        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Meta Decks</div>
          <div className="text-2xl font-bold text-amber-400">
            {meta?.total_decks || "—"}
          </div>
          <div className="text-xs text-slate-600">pre-modern decks tracked</div>
        </div>
      </div>

      {/* Meta Archetype Pills */}
      {meta?.archetypes && Object.keys(meta.archetypes).length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">
            Top Archetypes
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(meta.archetypes).map(([category, archetypes]) => 
              (archetypes as [string, number][]).slice(0, 1).map(([name, pct]) => (
                <span
                  key={`${category}-${name}`}
                  className="px-2 py-1 bg-slate-800 rounded-md text-xs text-slate-300"
                >
                  {name} ({pct}%)
                </span>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
