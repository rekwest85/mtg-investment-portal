const STORE_ICONS: Record<string, string> = {
  "Face to Face Games": "🎲",
  "401 Games": "🎯",
  "Wizard's Tower": "🔮",
  "Taps Games": "🃏",
  "Hairy Tarantula": "🕷️",
  "Cardboard Classics": "📦",
  "Gamezilla": "🦎",
  "Hobbiesville": "🎪",
  "Level Up Games": "⬆️",
  "Game Knight": "♟️",
};

const STORE_COLORS: Record<string, string> = {
  "Face to Face Games": "border-l-emerald-500",
  "401 Games": "border-l-blue-500",
  "Wizard's Tower": "border-l-violet-500",
  "Taps Games": "border-l-orange-500",
  "Hairy Tarantula": "border-l-rose-500",
  "Cardboard Classics": "border-l-amber-500",
  "Gamezilla": "border-l-cyan-500",
  "Hobbiesville": "border-l-pink-500",
  "Level Up Games": "border-l-lime-500",
  "Game Knight": "border-l-indigo-500",
};

export default function StoreSummary({
  name,
  count,
  total,
}: {
  name: string;
  count: number;
  total: number;
}) {
  return (
    <div
      className={`bg-slate-900/80 border border-slate-800 rounded-xl p-4 border-l-4 ${
        STORE_COLORS[name] || "border-l-slate-600"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{STORE_ICONS[name] || "🏪"}</span>
        <span className="text-sm font-medium text-slate-300">{name}</span>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <div className="text-2xl font-bold text-slate-100">{count}</div>
          <div className="text-xs text-slate-500">cards in stock</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold font-mono text-emerald-400">
            ${total.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500">total CAD</div>
        </div>
      </div>
    </div>
  );
}
