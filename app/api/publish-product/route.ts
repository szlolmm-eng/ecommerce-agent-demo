import { NextResponse } from "next/server";
import { publishProduct } from "@/lib/product-store";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 64_000) throw new Error("请求内容过长");
    const draft = await request.json();
    const product = await publishProduct(draft);
    return NextResponse.json({ success: true, productId: product.productId, publishedAt: product.publishedAt });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "发布失败" }, { status: 400 });
  }
}
