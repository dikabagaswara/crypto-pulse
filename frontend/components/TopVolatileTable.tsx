"use client";

import React, { useState } from "react";
import { Search, ArrowUpDown, TrendingUp, TrendingDown, Flame, Eye, ChevronRight } from "lucide-react";
import { VolatilityMetric } from "../lib/api";
import { formatIDR, formatPct, getVolatilityBadgeColor } from "../lib/utils";

interface TableProps {
  metrics: VolatilityMetric[];
  selectedTimeframe: string;
  onTimeframeChange: (tf: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (field: string) => void;
  onSelectCoin: (symbol: string) => void;
  isLoading: boolean;
}

export const TopVolatileTable: React.FC<TableProps> = ({
  metrics,
  selectedTimeframe,
  onTimeframeChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onSelectCoin,
  isLoading,
}) => {
  const timeframes = ["5m", "15m", "30m", "1h"];

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden">
      
      {/* Header Controls: Timeframe Tabs & Search Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Timeframe Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 self-start md:self-auto">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedTimeframe === tf
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {tf.toUpperCase()} Window
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search coin pair (e.g. BTC, ETH, SOL, KAITO)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>

      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6"># Rank</th>
              <th className="py-3.5 px-4 sm:px-6">Coin Pair</th>
              <th 
                className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => onSortChange("latest_price")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Price (IDR)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => onSortChange("price_change_pct")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Net Return ({selectedTimeframe})</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => onSortChange("realized_volatility")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Realized Vol (&sigma;)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => onSortChange("price_range_pct")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Range Swing</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                className="py-3.5 px-4 sm:px-6 text-right cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => onSortChange("volatility_score")}
              >
                <div className="flex items-center justify-end gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Vol Score</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-center">Chart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-6">
                    <div className="h-4 bg-slate-800/50 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : metrics.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                  No coins found matching "{searchQuery}".
                </td>
              </tr>
            ) : (
              metrics.map((coin, index) => {
                const badge = getVolatilityBadgeColor(coin.volatility_score);
                const isUp = coin.price_change_pct >= 0;

                return (
                  <tr
                    key={coin.symbol}
                    onClick={() => onSelectCoin(coin.symbol)}
                    className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 sm:px-6 text-slate-400 font-bold">
                      #{index + 1}
                    </td>

                    {/* Pair Name */}
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-white group-hover:text-cyan-400 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-[10px] text-cyan-400">
                          {coin.base_currency.slice(0, 3)}
                        </div>
                        <div>
                          <div className="uppercase tracking-tight">{coin.base_currency}/IDR</div>
                          <div className="text-[10px] text-slate-500 font-normal">PINTU Exchange</div>
                        </div>
                      </div>
                    </td>

                    {/* Latest Price */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-200 font-mono">
                      {formatIDR(coin.latest_price)}
                    </td>

                    {/* Net Price Change % */}
                    <td className={`py-3.5 px-4 text-right font-bold font-mono ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {formatPct(coin.price_change_pct)}
                      </div>
                    </td>

                    {/* Realized Volatility */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-300 font-mono">
                      {coin.realized_volatility.toFixed(2)}%
                    </td>

                    {/* Price Range Swing */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-300 font-mono">
                      {coin.price_range_pct.toFixed(2)}%
                    </td>

                    {/* Volatility Score */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg border ${badge.bg} ${badge.text} ${badge.border} font-mono shadow-sm`}>
                        {coin.volatility_score.toFixed(2)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-400 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
