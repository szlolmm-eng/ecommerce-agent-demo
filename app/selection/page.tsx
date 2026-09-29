"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScoredMarketProduct, SelectionAnalysis } from "@/lib/types";

type AnalysisState = { loading?: boolean; provider?: string; data?: SelectionAnalysis; error?: string };

export default function SelectionPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ScoredMarketProduct[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [sortByScore, setSortByScore] = useState(true);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisState>>({});

  const visibleProducts = useMemo(() => sortByScore ? [...products].sort((a, b) => b.opportunityScore - a.opportunityScore) : products, [products, sortByScore]);

  async function syncProducts() {
    setSyncing(true); setError(""); setLogs(["Connecting to Demo Market Data..."]);
    try {
      await new Promise((resolve) => setTimeout(resolve, 180));
      setLogs((old) => [...old, "Fetching products..."]);
      const response = await fetch("/api/market-products", { cache: "no-store" });
      const data = await response.json() as { success: boolean; products: ScoredMarketProduct[]; logs: string[]; error?: string };
      if (!response.ok || !data.success) throw new Error(data.error || "同步失败");
      for (const entry of data.logs.slice(2)) {
        setLogs((old) => [...old, entry]);
        await new Promise((resolve) => setTimeout(resolve, 130));
      }
      setProducts(data.products);
    } catch (err) { setError(err instanceof Error ? err.message : "同步失败"); }
    finally { setSyncing(false); }
  }

  async function analyze(product: ScoredMarketProduct) {
    setAnalyses((old) => ({ ...old, [product.id]: { loading: true } }));
    try {
      const response = await fetch("/api/selection-analysis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(product) });
      const result = await response.json() as { success: boolean; provider: string; analysis: SelectionAnalysis; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "AI 分析失败");
      setAnalyses((old) => ({ ...old, [product.id]: { provider: result.provider, data: result.analysis } }));
    } catch (err) { setAnalyses((old) => ({ ...old, [product.id]: { error: err instanceof Error ? err.message : "AI 分析失败" } })); }
  }

  function enterAgent(product: ScoredMarketProduct) {
    const params = new URLSearchParams({ sourceId: product.id, name: product.name, description: product.description, costPrice: String(product.costPrice), marketPrice: String(product.marketPrice), category: product.category, imageUrl: product.imageUrl || "" });
    router.push(`/?${params.toString()}`);
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-3"><h2 className="text-2xl font-bold">选品中心</h2><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Demo Market Data / 模拟市场数据</span></div><p className="mt-1 text-sm text-slate-500">从外部数据源同步候选品，使用确定性指标评分，再由 AI 提供业务解读。</p></div><button onClick={syncProducts} disabled={syncing} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">{syncing ? "正在同步..." : "同步候选商品"}</button></div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {logs.length > 0 && <div className="rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-300">{logs.map((log, index) => <p key={`${log}-${index}`}><span className="mr-2 text-slate-500">›</span>{log}</p>)}</div>}

    <section className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">机会分计算规则（0–100，普通代码计算）</p><p className="mt-1 text-xs text-blue-700">毛利率 30分 + 30日销量 25分 + 30日增长 20分 + 竞争度 15分 + 低退货率 10分。各项标准化后相加，AI 不参与数值计算。</p></div>{products.length > 0 && <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={sortByScore} onChange={(e) => setSortByScore(e.target.checked)} />按机会分降序</label>}</div>
    </section>

    {!products.length && !syncing && <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center text-sm text-slate-400">点击“同步候选商品”，通过服务端 Data Source API 获取模拟市场数据</div>}
    <div className="grid gap-5 lg:grid-cols-2">{visibleProducts.map((product) => {
      const analysis = analyses[product.id];
      return <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-slate-400">{product.id} · {product.category}</p><h3 className="mt-1 text-lg font-bold">{product.name}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{product.description}</p></div><div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl ${product.opportunityScore >= 70 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><span className="text-2xl font-bold">{product.opportunityScore}</span><span className="text-[10px]">机会分</span></div></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6"><Metric label="成本" value={`¥${product.costPrice}`} /><Metric label="市场价" value={`¥${product.marketPrice}`} /><Metric label="单件毛利" value={`¥${product.unitProfit}`} /><Metric label="毛利率" value={`${product.grossMargin}%`} /><Metric label="30日销量" value={String(product.sales30d)} /><Metric label="30日增长" value={`${product.growth30d}%`} /></div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-slate-100 px-2.5 py-1">竞争度：{levelLabel(product.competitionLevel)}</span><span className="rounded-full bg-slate-100 px-2.5 py-1">退货率：{product.returnRate}%</span><span title={Object.entries(product.scoreBreakdown).map(([k, v]) => `${k}: ${v}`).join(" / ")} className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">评分明细：{Object.values(product.scoreBreakdown).join(" + ")}</span></div>
        {analysis?.error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{analysis.error}</p>}
        {analysis?.data && <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-4 text-xs leading-5 text-slate-700"><div className="flex justify-between"><p className="font-bold text-violet-800">AI 选品分析</p><span className="text-violet-500">{analysis.provider}</span></div><p className="mt-2"><b>结论：</b>{analysis.data.verdict}</p><p><b>机会：</b>{analysis.data.opportunity}</p><p><b>风险：</b>{analysis.data.risk}</p><p><b>营销角度：</b>{analysis.data.marketingAngle}</p><p><b>目标用户：</b>{analysis.data.targetAudience}</p></div>}
        <div className="mt-4 flex gap-3"><button onClick={() => analyze(product)} disabled={analysis?.loading} className="flex-1 rounded-lg border border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50">{analysis?.loading ? "AI 分析中..." : analysis?.data ? "重新分析" : "AI 分析"}</button>{analysis?.data && <button onClick={() => enterAgent(product)} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">进入上架流程 →</button>}</div>
      </article>;
    })}</div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-slate-50 px-2 py-2"><p className="text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-700">{value}</p></div>; }
function levelLabel(level: string) { return level === "low" ? "低" : level === "medium" ? "中" : "高"; }
