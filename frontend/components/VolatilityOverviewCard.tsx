"use client";

import React from "react";
import { Flame, TrendingUp, TrendingDown, Zap, BarChart2, ShieldAlert } from "lucide-react";
import { VolatilityMetric } from "../lib/api";
import { formatIDR, formatPct, getVolatilityBadgeColor } from "../lib/utils";

interface OverviewProps {
  top5m?: VolatilityMetric;
  top15m?: VolatilityMetric;
  top30m?: VolatilityMetric;
  top1h?: VolatilityMetric;
  onSelectCoin: (symbol: string) => void;
}

export const VolatilityOverviewCard: React.FC<OverviewProps> = ({
  top5m,
  top15m,
  top30m,
  top1h,
  onSelectCoin,
}) => {
  const timeframes = [
    { label: "5m Breakout", tf: "5m", data: top5m, icon: Zap, color: "from-amber-500/20 to-orange-500/10", border: "border-amber-500/30", text: "text-amber-400" },
    { label: "15m Momentum", tf: "15m", data: top15m, icon: Flame, color: "from-rose-500/20 to-pink-500/10", border: "border-rose-500/30", text: "text-rose-400" },
    { label: "30m Dynamic", tf: "30m", data: top30m, icon: TrendingUp, color: "from-purple-500/20 to-indigo-500/10", border: "border-purple-500/30", text: "text-purple-400" },
    { label: "1h Trend Swing", tf: "1h", data: top1h, icon: BarChart2, color: "from-cyan-500/20 to-blue-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {timeframes.map(({ label, tf, data, icon: Icon, color, border, text }) => {
        if (!data) {
          return (
            <div key={tf} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse flex flex-col justify-between h-36">
              <div className="h-4 bg-slate-800 rounded w-1/2"></div>
              <div className="h-6 bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-800 rounded w-1/3"></div>
            </div>
          );
        }

        const badge = getVolatilityBadgeColor(data.volatility_score);
        const isPositive = data.price_change_pct >= 0;

        return (
          <div
            key={tf}
            onClick={() => onSelectCoin(data.symbol)}
            className={`group relative p-4 rounded-xl bg-gradient-to-b ${color} bg-slate-900/80 border ${border} hover:border-slate-600 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-cyan-500/5`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-4 h-4 ${text}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{label}</span>
              </div>
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                Vol Score: {data.volatility_score.toFixed(2)}
              </span>
            </div>

            {/* Symbol & Price */}
            <div className="mt-1">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                  {data.base_currency}/IDR
                </h3>
                <div className={`flex items-center gap-0.5 text-xs font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                  {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {formatPct(data.price_change_pct)}
                </div>
              </div>
              
              <div className="text-sm font-semibold text-slate-300 mt-0.5">
                {formatIDR(data.latest_price)}
              </div>
            </div>

            {/* Sub-metrics */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px]">
              <div>
                <span className="text-slate-400 font-medium">Realized Vol:</span>
                <span className="ml-1 text-slate-200 font-semibold">{data.realized_volatility.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Range Swing:</span>
                <span className="ml-1 text-slate-200 font-semibold">{data.price_range_pct.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
