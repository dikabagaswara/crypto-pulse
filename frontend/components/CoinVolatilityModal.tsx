"use client";

import React, { useEffect, useState } from "react";
import { X, TrendingUp, TrendingDown, Activity, BarChart3, RefreshCcw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { api, PricePoint } from "../lib/api";
import { formatIDR, formatPct } from "../lib/utils";

interface ModalProps {
  symbol: string | null;
  onClose: () => void;
}

export const CoinVolatilityModal: React.FC<ModalProps> = ({ symbol, onClose }) => {
  const [timeframe, setTimeframe] = useState<string>("1h");
  const [points, setPoints] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!symbol) return;

    let isMounted = true;
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await api.getCoinPriceHistory(symbol, timeframe);
        if (isMounted) {
          setPoints(res.points);
        }
      } catch (err) {
        console.error("Failed to load coin price history", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [symbol, timeframe]);

  if (!symbol) return null;

  const baseSymbol = symbol.split("/")[0].toUpperCase();
  const latestPrice = points.length > 0 ? points[points.length - 1].price : 0;
  const startPrice = points.length > 0 ? points[0].price : 0;
  const netChangePct = startPrice > 0 ? ((latestPrice - startPrice) / startPrice) * 100 : 0;
  const isUp = netChangePct >= 0;

  const prices = points.map((p) => p.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const formattedChartData = points.map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    price: p.price,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-slate-950 text-sm">
              {baseSymbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{baseSymbol}/IDR</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold text-cyan-400 bg-cyan-950 border border-cyan-800 rounded-md uppercase">
                  PINTU Market
                </span>
              </div>
              <p className="text-xs text-slate-400">Detailed Real-Time Volatility Analysis</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Latest Price</span>
              <div className="text-base font-extrabold text-white font-mono">{formatIDR(latestPrice)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Net Change ({timeframe})</span>
              <div className={`text-base font-extrabold font-mono flex items-center gap-1 ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {formatPct(netChangePct)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Window Low</span>
              <div className="text-base font-bold text-slate-300 font-mono">{formatIDR(minPrice)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Window High</span>
              <div className="text-base font-bold text-slate-300 font-mono">{formatIDR(maxPrice)}</div>
            </div>
          </div>

          {/* Timeframe Selector & Chart */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">Price Trend & Volatility Curve</span>
              </div>
              
              <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                {["5m", "15m", "30m", "1h", "24h"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                      timeframe === tf
                        ? "bg-cyan-500 text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs gap-2">
                  <RefreshCcw className="w-4 h-4 animate-spin text-cyan-400" />
                  Loading historical price tick data...
                </div>
              ) : formattedChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  No historical data available for this timeframe yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedChartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis
                      domain={["auto", "auto"]}
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(val) => formatIDR(val).replace("Rp ", "")}
                      orientation="right"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        fontSize: "0.75rem",
                        color: "#f8fafc",
                      }}
                      formatter={(val: any) => [formatIDR(Number(val)), "Price"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isUp ? "#10b981" : "#f43f5e"}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
