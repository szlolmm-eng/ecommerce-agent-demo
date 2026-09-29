export type ProductInput = {
  name: string;
  description: string;
  costPrice: number;
  imageUrl?: string;
};

export type RuleCheck = { name: string; passed: boolean; message: string };

export type ProductDraft = ProductInput & {
  title: string;
  category: string;
  sellingPoints: string[];
  generatedDescription: string;
  suggestedPrice: number;
  grossMargin: number;
  ruleChecks: RuleCheck[];
};

export type AgentStep = {
  id: number;
  name: string;
  status: "completed" | "failed";
  summary: string;
  result: string;
  durationMs: number;
};

export type PublishedProduct = ProductDraft & {
  productId: string;
  publishedAt: string;
  status: "published";
};

export type CompetitionLevel = "low" | "medium" | "high";

export type MarketProduct = {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  marketPrice: number;
  sales30d: number;
  growth30d: number;
  competitionLevel: CompetitionLevel;
  returnRate: number;
  description: string;
  imageUrl?: string;
};

export type ScoredMarketProduct = MarketProduct & {
  unitProfit: number;
  grossMargin: number;
  opportunityScore: number;
  scoreBreakdown: {
    margin: number;
    sales: number;
    growth: number;
    competition: number;
    returnRisk: number;
  };
};

export type SelectionAnalysis = {
  verdict: string;
  opportunity: string;
  risk: string;
  marketingAngle: string;
  targetAudience: string;
};
