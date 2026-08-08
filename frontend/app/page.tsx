"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Navbar } from "../components/Navbar";
import { VolatilityOverviewCard } from "../components/VolatilityOverviewCard";
import { TopVolatileTable } from "../components/TopVolatileTable";
import { CoinVolatilityModal } from "../components/CoinVolatilityModal";
import { api, VolatilityMetric, DashboardOverview } from "../lib/api";
import { useWebSocket } from "../lib/useWebSocket";
import { Flame, ShieldAlert, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("15m");
  const [sortBy, setSortBy] = useState<string>("volatility_score");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const [topCoins, setTopCoins] = useState<VolatilityMetric[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [selectedCoinSymbol, setSelectedCoinSymbol] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const { isConnected, lastMessage } = useWebSocket();

  // Load metrics data from FastAPI backend
  const loadData = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    try {
      const [coinsRes, overviewRes] = await Promise.all([
        api.getTopVolatileCoins(selectedTimeframe, sortBy, searchQuery, 50),
        api.getDashboardOverview(),
      ]);
      setTopCoins(coinsRes);
      setOverview(overviewRes);
    } catch (err) {
      console.error("Error loading volatility metrics:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTimeframe, sortBy, searchQuery]);

  // Initial load and reload on filter/search change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time WebSocket tick trigger
  useEffect(() => {
    if (lastMessage && lastMessage.event === "VOLATILITY_TICK") {
      loadData();
    }
  }, [lastMessage, loadData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Sticky Navigation */}
      <Navbar
        isConnected={isConnected}
        totalCoins={overview?.total_coins_monitored || 0}
        lastUpdated={overview?.last_updated || null}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        
        {/* Banner Section */}
        <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quantitative Crypto Analytics</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                PINTU Exchange Real-Time Volatility Engine
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                Detect high-frequency price swings, breakout momentum, and log return dispersion across 
                <strong className="text-slate-200"> 5-minute, 15-minute, 30-minute, and 1-hour </strong> windows.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 self-stretch md:self-auto justify-around sm:justify-start">
              <div className="text-center sm:text-left">
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Snapshots</div>
                <div className="text-lg font-black text-cyan-400 font-mono">
                  {overview?.total_price_snapshots ? overview.total_price_snapshots.toLocaleString() : "..."}
                </div>
              </div>
              <div className="w-[1px] h-8 bg-slate-800"></div>
              <div className="text-center sm:text-left">
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Sampling Interval</div>
                <div className="text-lg font-black text-emerald-400 font-mono">1 Minute</div>
              </div>
            </div>

          </div>
        </div>

        {/* Top Volatile Timeframe Overview Cards */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500 animate-bounce" />
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Top Volatile Coin Leaders by Window
            </h3>
          </div>

          <VolatilityOverviewCard
            top5m={overview?.top_5m}
            top15m={overview?.top_15m}
            top30m={overview?.top_30m}
            top1h={overview?.top_1h}
            onSelectCoin={(symbol) => setSelectedCoinSymbol(symbol)}
          />
        </section>

        {/* Interactive Main Volatile Coins Ranking Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                Top Volatile Coins Ranking
              </h3>
              <p className="text-xs text-slate-400">
                Sorted by Quantitative Volatility Score (Standard Deviation & Amplitude Range)
              </p>
            </div>
          </div>

          <TopVolatileTable
            metrics={topCoins}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={(tf) => setSelectedTimeframe(tf)}
            searchQuery={searchQuery}
            onSearchChange={(q) => setSearchQuery(q)}
            sortBy={sortBy}
            onSortChange={(field) => setSortBy(field)}
            onSelectCoin={(symbol) => setSelectedCoinSymbol(symbol)}
            isLoading={isLoading}
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-400">PINTU Exchange Quant Volatility Dashboard &copy; 2026</p>
        <p className="mt-1 text-[11px] text-slate-600">Built with Python • FastAPI • SQLAlchemy • PostgreSQL • Next.js 14 • Recharts</p>
      </footer>

      {/* Detailed Volatility Chart Modal */}
      <CoinVolatilityModal
        symbol={selectedCoinSymbol}
        onClose={() => setSelectedCoinSymbol(null)}
      />

    </div>
  );
}
