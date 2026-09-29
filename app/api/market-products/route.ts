import { NextResponse } from "next/server";
import { getMarketDataSource } from "@/lib/market-data-source";
import { scoreMarketProduct } from "@/lib/opportunity-score";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const source = getMarketDataSource();
    const products = (await source.fetchProducts()).map(scoreMarketProduct);
    return NextResponse.json({ success: true, source: source.name, products, logs: ["Connecting to Demo Market Data...", "Fetching products...", "HTTP 200", `${products.length} products received`, "Data synchronized successfully"] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "同步商品失败" }, { status: 500 });
  }
}
