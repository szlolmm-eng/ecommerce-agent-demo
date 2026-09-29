"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AgentStep, ProductDraft } from "@/lib/types";

type AgentResponse = { success: boolean; provider: string; steps: AgentStep[]; draft: ProductDraft; error?: string };
type PublishResult = { success: boolean; productId?: string; publishedAt?: string; error?: string };

const initial = { name: "", description: "", costPrice: "", imageUrl: "" };

export default function AgentWorkbench() {
  return <Suspense fallback={<div className="py-20 text-center text-sm text-slate-400">正在加载工作台...</div>}><AgentWorkbenchContent /></Suspense>;
}

function AgentWorkbenchContent() {
  const params = useSearchParams();
  const hasSelection = Boolean(params.get("name") && params.get("description") && params.get("costPrice"));
  const [form, setForm] = useState(() => hasSelection ? { name: params.get("name") || "", description: params.get("description") || "", costPrice: params.get("costPrice") || "", imageUrl: params.get("imageUrl") || "" } : initial);
  const [selectionContext] = useState<{ id: string; category: string; marketPrice: string } | null>(() => hasSelection ? { id: params.get("sourceId") || "候选商品", category: params.get("category") || "未分类", marketPrice: params.get("marketPrice") || "-" } : null);
  const [running, setRunning] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<AgentStep[]>([]);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [provider, setProvider] = useState("");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);

  function update(key: keyof typeof form, value: string) { setForm((old) => ({ ...old, [key]: value })); }

  async function runAgent(event: React.FormEvent) {
    event.preventDefault(); setRunning(true); setError(""); setDraft(null); setVisibleSteps([]); setPublishResult(null);
    try {
      const response = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, costPrice: Number(form.costPrice) }) });
      const data = await response.json() as AgentResponse;
      if (!response.ok || !data.success) throw new Error(data.error || "Agent 执行失败");
      setProvider(data.provider);
      for (const step of data.steps) {
        setVisibleSteps((old) => [...old, step]);
        await new Promise((resolve) => setTimeout(resolve, 220));
      }
      setDraft(data.draft);
    } catch (err) { setError(err instanceof Error ? err.message : "Agent 执行失败"); }
    finally { setRunning(false); }
  }

  async function publish() {
    if (!draft) return;
    setPublishing(true); setError("");
    try {
      const response = await fetch("/api/publish-product", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json() as PublishResult;
      if (!response.ok || !data.success) throw new Error(data.error || "发布失败");
      setPublishResult(data);
    } catch (err) { setError(err instanceof Error ? err.message : "发布失败"); }
    finally { setPublishing(false); }
  }

  return <div className="space-y-6">
    <div><h2 className="text-2xl font-bold">Agent 工作台</h2><p className="mt-1 text-sm text-slate-500">输入原始资料，由 Agent 生成内容、执行规则并等待人工确认。</p></div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={runAgent} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold">商品资料输入</h3>
        {selectionContext && <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800"><p className="font-semibold">已从选品中心带入</p><p className="mt-1">{selectionContext.id} · {selectionContext.category} · 市场参考价 ¥{selectionContext.marketPrice}</p></div>}
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium">商品名称<input required maxLength={80} value={form.name} onChange={(e) => update("name", e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="例如：便携手冲咖啡壶" /></label>
          <label className="block text-sm font-medium">原始商品描述<textarea required maxLength={2000} rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} className="mt-1.5 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="材质、规格、适用场景等原始资料" /></label>
          <label className="block text-sm font-medium">成本价（元）<input required min="0.01" step="0.01" type="number" value={form.costPrice} onChange={(e) => update("costPrice", e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="80.00" /></label>
          <label className="block text-sm font-medium">商品图片 URL <span className="font-normal text-slate-400">（可选）</span><input type="url" maxLength={500} value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="https://..." /></label>
        </div>
        <button disabled={running || publishing} className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">{running ? "Agent 运行中..." : "启动 Agent"}</button>
      </form>

      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="font-semibold">执行过程</h3>{provider && <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">{provider}</span>}</div>
          {!visibleSteps.length && !running && <div className="py-12 text-center text-sm text-slate-400">启动 Agent 后，此处将显示完整执行日志</div>}
          <div className="mt-4 space-y-3">{visibleSteps.map((step) => <div key={step.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start gap-3"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-white ${step.status === "completed" ? "bg-emerald-500" : "bg-red-500"}`}>{step.status === "completed" ? "✓" : "!"}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><p className="font-medium">{step.id}. {step.name}</p><span className="shrink-0 text-xs text-slate-400">{step.durationMs} ms</span></div><p className="mt-1 text-xs text-slate-500">{step.summary}</p><p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{step.result}</p></div></div></div>)}</div>
          {running && <div className="mt-3 flex items-center gap-2 text-sm text-blue-600"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />正在执行下一步...</div>}
        </section>

        {draft && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="font-semibold">结构化商品预览</h3><span className={`rounded-full px-3 py-1 text-xs font-semibold ${publishResult ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{publishResult ? "已发布" : "等待人工确认"}</span></div>
          <div className="mt-5 grid gap-5 md:grid-cols-2"><Info label="商品标题" value={draft.title} /><Info label="分类" value={draft.category} /><Info label="成本价" value={`¥${draft.costPrice.toFixed(2)}`} /><Info label="建议售价" value={`¥${draft.suggestedPrice.toFixed(2)}`} /><Info label="预计毛利率" value={`${draft.grossMargin}%`} /><div className="md:col-span-2"><p className="text-xs text-slate-400">核心卖点</p><ul className="mt-2 grid gap-2 sm:grid-cols-2">{draft.sellingPoints.map((point) => <li key={point} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">• {point}</li>)}</ul></div><div className="md:col-span-2"><Info label="商品描述" value={draft.generatedDescription} /></div></div>
          <div className="mt-5 border-t border-slate-100 pt-5"><p className="text-xs text-slate-400">规则检查结果</p><div className="mt-2 flex flex-wrap gap-2">{draft.ruleChecks.map((rule) => <span title={rule.message} key={rule.name} className={`rounded-full px-3 py-1.5 text-xs font-medium ${rule.passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{rule.passed ? "✓" : "×"} {rule.name}</span>)}</div></div>
          {!publishResult ? <button onClick={publish} disabled={publishing || !draft.ruleChecks.every((x) => x.passed)} className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">{publishing ? "正在调用 publish_product..." : "确认上架"}</button> : <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><p className="font-semibold">publish_product Tool 调用成功</p><p className="mt-1 font-mono text-xs">success: true · productId: {publishResult.productId} · publishedAt: {publishResult.publishedAt}</p><a href="/products" className="mt-3 inline-block font-semibold underline">前往已上架商品验证 →</a></div>}
        </section>}
      </div>
    </div>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-sm font-medium leading-6 text-slate-800">{value}</p></div>; }
