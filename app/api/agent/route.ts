import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai-provider";
import { calculateGrossMargin, calculateSuggestedPrice, runRuleChecks, validateInput } from "@/lib/rules";
import type { AgentStep } from "@/lib/types";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 32_000) throw new Error("请求内容过长");
    const input = validateInput(await request.json());
    const provider = getAIProvider();
    const startedAt = Date.now();
    const aiStarted = performance.now();
    const content = await provider.generate(input);
    const aiDuration = Math.round(performance.now() - aiStarted);
    const price = calculateSuggestedPrice(input.costPrice);
    const grossMargin = calculateGrossMargin(input.costPrice, price);
    const baseDraft = { ...input, title: content.title, category: content.category, sellingPoints: content.sellingPoints, generatedDescription: content.description, suggestedPrice: price, grossMargin };
    const ruleChecks = runRuleChecks(baseDraft);
    const draft = { ...baseDraft, ruleChecks };
    const slice = Math.max(12, Math.round(aiDuration / 5));
    const steps: AgentStep[] = [
      { id: 1, name: "解析商品信息", status: "completed", summary: "提取商品名称、描述与成本信息", result: `识别为“${input.name}”，成本 ¥${input.costPrice.toFixed(2)}`, durationMs: slice },
      { id: 2, name: "生成商品标题", status: "completed", summary: `由 ${provider.name} 生成适合上架的标题`, result: content.title, durationMs: slice },
      { id: 3, name: "生成核心卖点", status: "completed", summary: "提炼消费者关注的产品价值", result: content.sellingPoints.join("；"), durationMs: slice },
      { id: 4, name: "生成商品描述", status: "completed", summary: "生成结构清晰的商品详情文案", result: content.description, durationMs: slice },
      { id: 5, name: "给出建议售价", status: "completed", summary: "使用确定性定价公式计算", result: `¥${price.toFixed(2)}，预计毛利率 ${grossMargin}%`, durationMs: 2 },
      { id: 6, name: "执行规则检查", status: ruleChecks.every((x) => x.passed) ? "completed" : "failed", summary: "检查字段、价格、毛利率与标题长度", result: `${ruleChecks.filter((x) => x.passed).length}/${ruleChecks.length} 项通过`, durationMs: 1 },
    ];
    return NextResponse.json({ success: true, provider: provider.name, startedAt: new Date(startedAt).toISOString(), completedAt: new Date().toISOString(), steps, draft });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Agent 执行失败" }, { status: 400 });
  }
}
