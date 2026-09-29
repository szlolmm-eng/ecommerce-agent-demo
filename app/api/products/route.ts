import { NextResponse } from "next/server";
import { listProducts } from "@/lib/product-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ success: true, products: await listProducts() });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "读取商品失败" }, { status: 500 });
  }
}
