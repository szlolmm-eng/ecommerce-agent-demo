import { listProducts } from "@/lib/product-store";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await listProducts();
  return <div className="space-y-6">
    <div className="flex items-end justify-between"><div><h2 className="text-2xl font-bold">已上架商品</h2><p className="mt-1 text-sm text-slate-500">通过 publish_product Tool 写入本地持久化存储的商品。</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">共 {products.length} 件</span></div>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {products.length === 0 ? <div className="py-20 text-center text-sm text-slate-400">暂无商品，请先在 Agent 工作台完成发布</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Product ID</th><th className="px-5 py-4">标题</th><th className="px-5 py-4">售价</th><th className="px-5 py-4">发布时间</th><th className="px-5 py-4">状态</th></tr></thead><tbody className="divide-y divide-slate-100">{products.map((product) => <tr key={product.productId} className="hover:bg-slate-50"><td className="px-5 py-4 font-mono text-xs text-slate-600">{product.productId}</td><td className="max-w-md px-5 py-4 font-medium">{product.title}</td><td className="px-5 py-4 font-semibold">¥{product.suggestedPrice.toFixed(2)}</td><td className="px-5 py-4 text-slate-500">{new Date(product.publishedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</td><td className="px-5 py-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">已上架</span></td></tr>)}</tbody></table></div>}
    </div>
  </div>;
}
