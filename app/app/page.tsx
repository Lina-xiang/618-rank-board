"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Trophy, TrendingUp, TrendingDown, Minus, RefreshCw, Clock, BarChart3, Award } from "lucide-react";

interface RankItem {
  rank: number;
  name: string;
  gmv: number;
  updatedAt: string;
  trend: "up" | "down" | "same";
}

interface RankResponse {
  items: RankItem[];
  totalGmv: number;
  totalBrands: number;
  updatedAt: string;
  source: string;
}

// 动画数字
function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 800;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * easeOut));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value]);

  const formatted =
    display >= 100000000
      ? (display / 100000000).toFixed(2) + "亿"
      : display >= 10000
      ? (display / 10000).toFixed(2) + "万"
      : display >= 1000
      ? (display / 1000).toFixed(1) + "K"
      : display.toLocaleString();

  return <span className="tabular-nums">{prefix}{formatted}</span>;
}

// 趋势标记
function TrendBadge({ trend }: { trend: string }) {
  if (trend === "up")
    return (
      <span className="flex items-center gap-0.5 text-emerald-400 text-sm font-bold animate-bounce">
        <TrendingUp className="w-4 h-4" />
      </span>
    );
  if (trend === "down")
    return (
      <span className="flex items-center gap-0.5 text-red-400 text-sm font-bold animate-bounce">
        <TrendingDown className="w-4 h-4" />
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-gray-500 text-sm">
      <Minus className="w-4 h-4" />
    </span>
  );
}

// 前三名卡片
function TopThreeCard({ item, index }: { item: RankItem; index: number }) {
  const isGold = index === 0;
  const isSilver = index === 1;
  const isBronze = index === 2;

  const gradientClass = isGold
    ? "bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-300"
    : isSilver
    ? "bg-gradient-to-br from-gray-600 via-gray-400 to-gray-300"
    : "bg-gradient-to-br from-orange-700 via-orange-500 to-orange-300";

  const medalEmoji = isGold ? "🥇" : isSilver ? "🥈" : "🥉";
  const sizeClass = isGold ? "scale-100 z-10" : isSilver ? "scale-95 opacity-90" : "scale-90 opacity-80";

  return (
    <div
      className={`relative rounded-2xl p-6 ${gradientClass} shadow-2xl ${sizeClass} transition-all hover:scale-105`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-bold text-white text-lg border-2 border-white/30">
        {medalEmoji}
      </div>
      <div className="absolute top-4 right-4">
        <TrendBadge trend={item.trend} />
      </div>
      <div className="mt-4 text-center">
        <div className="text-4xl mb-2">{medalEmoji}</div>
        <h3 className="text-white font-bold text-lg mb-1 truncate">{item.name}</h3>
        <p className="text-white/60 text-xs mb-3">
          更新于 {new Date(item.updatedAt).toLocaleString("zh-CN")}
        </p>
        <div className="text-3xl font-black text-white">
          <AnimatedNumber value={item.gmv} prefix="¥" />
        </div>
        <p className="text-white/50 text-xs mt-1">GMV</p>
      </div>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
}

// 排名行
function RankRow({ item, index }: { item: RankItem; index: number }) {
  const rankColor =
    item.rank <= 3 ? "text-yellow-400" : item.rank <= 10 ? "text-blue-400" : "text-gray-400";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
      style={{ animationDelay: `${(index + 3) * 0.05}s` }}
    >
      <div className={`w-8 text-center font-black text-lg ${rankColor}`}>
        {item.rank <= 3 ? ["🥇", "🥈", "🥉"][item.rank - 1] : item.rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-100 truncate">{item.name}</p>
        <p className="text-xs text-gray-500">
          更新 {new Date(item.updatedAt).toLocaleString("zh-CN")}
        </p>
      </div>
      <TrendBadge trend={item.trend} />
      <div className="text-right min-w-[120px]">
        <p className="font-bold text-emerald-400 text-sm">
          ¥<AnimatedNumber value={item.gmv} />
        </p>
      </div>
    </div>
  );
}

// 主页面
export default function HomePage() {
  const [data, setData] = useState<RankResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(300);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rank");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const result: RankResponse = await res.json();
      setData(result);
      setError("");
      setCountdown(300);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载 + 5分钟轮询
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // 倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const top3 = data?.items.slice(0, 3) || [];
  const rest = data?.items.slice(3) || [];
  const formatCountdown = `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a1a]/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                星罗618品牌PK看板
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">GMV 实时排行榜 · 飞书多维表格</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatCountdown} 后刷新</span>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-full transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                刷新
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
            <p className="font-medium">数据获取失败</p>
            <p className="text-red-400/70 mt-1">{error}</p>
            <p className="text-red-400/50 text-xs mt-2">
              请检查环境变量配置（FEISHU_APP_ID, FEISHU_APP_SECRET, FEISHU_APP_TOKEN, FEISHU_TABLE_ID）
            </p>
          </div>
        )}

        {/* 汇总卡片 */}
        {data && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-gray-400">总GMV</span>
              </div>
              <p className="text-2xl font-black text-emerald-400">
                ¥<AnimatedNumber value={data.totalGmv} />
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-400">参与品牌</span>
              </div>
              <p className="text-2xl font-black text-yellow-400">
                {data.totalBrands}
                <span className="text-sm font-normal text-gray-500 ml-1">个</span>
              </p>
            </div>
          </div>
        )}

        {/* 前三名 */}
        {top3.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              前三名
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {top3.length >= 2 && <TopThreeCard item={top3[1]} index={1} />}
              {top3.length >= 1 && <TopThreeCard item={top3[0]} index={0} />}
              {top3.length >= 3 && <TopThreeCard item={top3[2]} index={2} />}
            </div>
          </div>
        )}

        {/* 完整排名 */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            完整排名
            {data && (
              <span className="text-xs font-normal text-gray-600 ml-2">
                数据源自飞书 · {new Date(data.updatedAt).toLocaleString("zh-CN")}
              </span>
            )}
          </h2>

          {loading && !data ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {rest.map((item, idx) => (
                <RankRow key={item.name} item={item} index={idx} />
              ))}
              {rest.length === 0 && top3.length === 0 && !error && (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p>暂无数据</p>
                  <p className="text-xs mt-1 text-gray-600">
                    请检查飞书表格中是否有品牌名称和GMV数据
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-600 py-6 border-t border-white/10">
          <p>星罗618品牌PK看板 · 数据源自飞书多维表格 · 每5分钟自动刷新</p>
        </footer>
      </main>
    </div>
  );
}
