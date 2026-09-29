import type { ProductDraft, ProductInput, RuleCheck } from "./types";

export function calculateSuggestedPrice(costPrice: number) {
  return Math.ceil((costPrice * 1.8) / 10) * 10 - 0.1;
}

export function calculateGrossMargin(costPrice: number, price: number) {
  return Number((((price - costPrice) / price) * 100).toFixed(1));
}

export function validateInput(value: unknown): ProductInput {
  if (!value || typeof value !== "object") throw new Error("请求数据格式错误");
  const input = value as Record<string, unknown>;
  const name = String(input.name ?? "").trim();
  const description = String(input.description ?? "").trim();
  const costPrice = Number(input.costPrice);
  const imageUrl = String(input.imageUrl ?? "").trim();
  if (!name) throw new Error("商品名称不能为空");
  if (!description) throw new Error("原始商品描述不能为空");
  if (name.length > 80) throw new Error("商品名称不能超过 80 字符");
  if (description.length > 2000) throw new Error("原始商品描述不能超过 2000 字符");
  if (!Number.isFinite(costPrice) || costPrice <= 0) throw new Error("成本价必须大于 0");
  if (imageUrl.length > 500) throw new Error("商品图片 URL 不能超过 500 字符");
  if (imageUrl) {
    try { new URL(imageUrl); } catch { throw new Error("商品图片 URL 格式不正确"); }
  }
  return { name, description, costPrice, imageUrl: imageUrl || undefined };
}

export function runRuleChecks(draft: Omit<ProductDraft, "ruleChecks">): RuleCheck[] {
  return [
    { name: "字段完整性", passed: Boolean(draft.title && draft.category && draft.generatedDescription && draft.sellingPoints.length >= 3), message: "标题、分类、描述及卖点均已生成" },
    { name: "售价规则", passed: draft.suggestedPrice > draft.costPrice, message: `售价 ¥${draft.suggestedPrice.toFixed(2)} 高于成本价 ¥${draft.costPrice.toFixed(2)}` },
    { name: "毛利率规则", passed: draft.grossMargin >= 20, message: `预计毛利率 ${draft.grossMargin}%（要求不低于 20%）` },
    { name: "标题长度", passed: draft.title.length <= 60, message: `标题 ${draft.title.length} 字符（上限 60）` },
  ];
}
