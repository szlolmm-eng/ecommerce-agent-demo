import type { MarketProduct, ScoredMarketProduct } from "./types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 10) / 10;

export function scoreMarketProduct(product: MarketProduct): ScoredMarketProduct {
  const unitProfit = round(product.marketPrice - product.costPrice);
  const grossMargin = round((unitProfit / product.marketPrice) * 100);
  const scoreBreakdown = {
    margin: round(clamp(grossMargin / 60, 0, 1) * 30),
    sales: round(clamp(product.sales30d / 2000, 0, 1) * 25),
    growth: round(clamp((product.growth30d + 10) / 70, 0, 1) * 20),
    competition: product.competitionLevel === "low" ? 15 : product.competitionLevel === "medium" ? 9 : 3,
    returnRisk: round(clamp((15 - product.returnRate) / 13, 0, 1) * 10),
  };
  const opportunityScore = Math.round(Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0));
  return { ...product, unitProfit, grossMargin, opportunityScore, scoreBreakdown };
}
