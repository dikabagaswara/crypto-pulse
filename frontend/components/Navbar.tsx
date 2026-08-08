"use client";

import React from "react";
import { Activity, Radio, RefreshCw, Layers } from "lucide-react";

interface NavbarProps {
  isConnected: boolean;
  totalCoins: number;
  lastUpdated: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  isConnected,
  totalCoins,
  lastUpdated,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                PINTU Quant Volatility
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-800/50 rounded-full uppercase">
                Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              High-Frequency Volatility Monitor • 5m, 15m, 30m & 1h Intervals
            </p>
          </div>
        </div>

        {/* Real-time Status Badges & Controls */}
        <div className="flex items-center gap-3">
          
          {/* Monitored Coins Count */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-medium">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{totalCoins > 0 ? totalCoins : 604} Pairs Monitored</span>
          </div>

          {/* WebSocket Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-medium">
            <div className="relative flex h-2 w-2">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              )}
            </div>
            <span className={isConnected ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
              {isConnected ? "LIVE STREAM" : "CONNECTING..."}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all disabled:opacity-50"
            title="Manual Sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>

      </div>
    </header>
  );
};
