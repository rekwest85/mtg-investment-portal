"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface PricePoint {
  date: string;
  price: number;
  avg_30d?: number;
  avg_60d?: number;
  avg_90d?: number;
}

export default function PriceChart({
  priceHistory,
  currentPrice,
}: {
  priceHistory: any;
  currentPrice: number;
}) {
  // Build chart data from history + current price
  const chartData: PricePoint[] = [];

  if (priceHistory?.entries) {
    for (const entry of priceHistory.entries) {
      chartData.push({
        date: entry.date?.slice(0, 10) || entry.date,
        price: entry.price,
        avg_30d: entry.avg_30d,
        avg_60d: entry.avg_60d,
        avg_90d: entry.avg_90d,
      });
    }
  }

  // Add current price as latest point
  if (chartData.length > 0) {
    chartData.push({
      date: "Now",
      price: currentPrice,
    });
  }

  if (chartData.length < 2) {
    return (
      <div className="text-xs text-slate-500 py-2 text-center">
        Not enough price history data yet
      </div>
    );
  }

  const avg30 = priceHistory?.avg_30d || chartData.map((d) => d.price).reduce((a, b) => a + b, 0) / chartData.length;
  const avg60 = priceHistory?.avg_60d || avg30;
  const avg90 = priceHistory?.avg_90d || avg30;

  return (
    <div className="space-y-2">
      <div className="flex gap-4 text-xs text-slate-400">
        <span>30d avg: <strong className="text-slate-200">${avg30.toFixed(2)}</strong></span>
        <span>60d avg: <strong className="text-slate-200">${avg60.toFixed(2)}</strong></span>
        <span>90d avg: <strong className="text-slate-200">${avg90.toFixed(2)}</strong></span>
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              hide
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={50}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={{ r: 3, fill: "#7c3aed" }}
              name="Price"
            />
            <Line
              type="monotone"
              dataKey="avg_30d"
              stroke="#06b6d4"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              name="30d avg"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
