import { NextResponse } from "next/server";
import { fetchRankData } from "@/lib/feishu";

// 简单的内存缓存，用于计算排名变化
let lastResult: { items: Array<{ rank: number; name: string; gmv: number; updatedAt: string }> } | null = null;

export async function GET() {
  try {
    const data = await fetchRankData();

    // 计算排名变化
    const itemsWithTrend = data.items.map((item) => {
      let trend: "up" | "down" | "same" = "same";
      if (lastResult) {
        const prev = lastResult.items.find((p) => p.name === item.name);
        if (prev) {
          if (item.rank < prev.rank) trend = "up";
          else if (item.rank > prev.rank) trend = "down";
        }
      }
      return { ...item, trend };
    });

    // 更新缓存
    lastResult = { items: data.items };

    return NextResponse.json({
      items: itemsWithTrend,
      totalGmv: data.totalGmv,
      totalBrands: data.totalBrands,
      updatedAt: data.updatedAt,
      source: "飞书多维表格",
    });
  } catch (error: any) {
    console.error("[/api/rank] error:", error);
    return NextResponse.json(
      { error: error.message || "获取数据失败" },
      { status: 500 }
    );
  }
}
