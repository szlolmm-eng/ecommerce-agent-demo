import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai-provider";
import type { ScoredMarketProduct } from "@/lib/types";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 32_000) throw new Error("请求内容过长");
    const product = await request.json() as ScoredMarketProduct;
    if (!product?.id || !Number.isFinite(product.opportunityScore)) throw new Error("选品指标不完整");
    if (product.name.length > 80 || product.description.length > 2000) throw new Error("选品内容过长");
    const provider = getAIProvider();
    const analysis = await provider.analyzeSelection(product);
    return NextResponse.json({ success: true, provider: provider.name, analysis });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "AI 分析失败" }, { status: 400 });
  }
}
