import type { ProductInput, ScoredMarketProduct, SelectionAnalysis } from "./types";

export type AIContent = {
  title: string;
  category: string;
  sellingPoints: string[];
  description: string;
};

export interface AIProvider {
  readonly name: string;
  generate(input: ProductInput): Promise<AIContent>;
  analyzeSelection(product: ScoredMarketProduct): Promise<SelectionAnalysis>;
}

const categoryKeywords: Array<[string, string]> = [
  ["咖啡|茶|食品|零食|饮", "食品饮料"],
  ["耳机|键盘|鼠标|充电|手机|数码", "数码配件"],
  ["面霜|精华|护肤|口红|美妆", "美妆个护"],
  ["衬衫|外套|裤|鞋|服装", "服饰鞋包"],
  ["灯|杯|收纳|家居|枕", "家居生活"],
];

export class MockAIProvider implements AIProvider {
  readonly name = "Mock AI Provider";

  async generate(input: ProductInput): Promise<AIContent> {
    await new Promise((resolve) => setTimeout(resolve, 180));
    const category = categoryKeywords.find(([pattern]) =>
      new RegExp(pattern).test(`${input.name}${input.description}`),
    )?.[1] ?? "其他商品";
    const detail = input.description.replace(/\s+/g, " ").trim();
    const shortDetail = detail.slice(0, 32);

    return {
      title: `${input.name}｜品质优选 实用之选`.slice(0, 60),
      category,
      sellingPoints: [
        `精选品质，适合日常使用`,
        shortDetail ? `产品亮点：${shortDetail}` : "设计简洁，使用方便",
        "高性价比，兼顾品质与预算",
        "包装完好，安心选购",
      ],
      description: `${input.name}，为注重品质与实用性的消费者打造。${detail}。从使用体验到细节设计均充分考虑日常需求，适合自用或送礼。`,
    };
  }

  async analyzeSelection(product: ScoredMarketProduct): Promise<SelectionAnalysis> {
    await new Promise((resolve) => setTimeout(resolve, 220));
    const attractive = product.opportunityScore >= 65;
    return {
      verdict: attractive ? `值得进入小规模测试，机会分 ${product.opportunityScore}，基础指标较均衡。` : `建议谨慎测试，机会分 ${product.opportunityScore}，需先验证需求或优化成本。`,
      opportunity: product.growth30d >= 30 ? `近30日增长 ${product.growth30d}%，需求处于较快增长阶段。` : `单件毛利 ¥${product.unitProfit.toFixed(2)}，具备一定价格操作空间。`,
      risk: product.competitionLevel === "high" ? "同类竞争较高，需要差异化素材与定价。" : `退货率 ${product.returnRate}%，主要关注品质一致性与描述准确度。`,
      marketingAngle: `围绕“${product.description.split("，")[0]}”突出具体使用场景和便利性。`,
      targetAudience: product.category.includes("宠物") ? "养猫养狗、关注日常清洁效率的宠物主人。" : "追求实用、性价比和便捷体验的年轻消费者。",
    };
  }
}

class DeepSeekProvider implements AIProvider {
  readonly name = "DeepSeek Provider（失败自动回退 Mock）";
  private readonly fallback = new MockAIProvider();
  constructor(private readonly apiKey: string) {}

  private async complete(prompt: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || "deepseek-chat", response_format: { type: "json_object" }, messages: [{ role: "system", content: "你是电商运营助手。只输出合法JSON；不要重新计算输入数字；各字段简洁。" }, { role: "user", content: prompt }], temperature: 0.4, max_tokens: 650 }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`DeepSeek API ${response.status}`);
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("DeepSeek 返回内容为空");
      return JSON.parse(content) as Record<string, unknown>;
    } finally { clearTimeout(timeout); }
  }

  async generate(input: ProductInput): Promise<AIContent> {
    try {
      return await this.complete(`根据商品生成上架内容：${JSON.stringify(input)}。返回字段 title（最多60字符）, category, sellingPoints（3-5条且每条最多50字符）, description（最多500字符）。`) as unknown as AIContent;
    } catch { return this.fallback.generate(input); }
  }

  async analyzeSelection(product: ScoredMarketProduct): Promise<SelectionAnalysis> {
    try {
      return await this.complete(`分析以下已计算好的选品指标：${JSON.stringify(product)}。返回简短字符串字段 verdict, opportunity, risk, marketingAngle, targetAudience，每项最多100字符。`) as unknown as SelectionAnalysis;
    } catch { return this.fallback.analyzeSelection(product); }
  }
}

export function getAIProvider(): AIProvider {
  if (process.env.DEEPSEEK_API_KEY) return new DeepSeekProvider(process.env.DEEPSEEK_API_KEY);
  return new MockAIProvider();
}
