const base = process.env.BASE_URL || "http://localhost:3000";
const marketResponse = await fetch(`${base}/api/market-products`);
const market = await marketResponse.json();
if (!marketResponse.ok || !market.success || market.products.length !== 10) throw new Error(`Market sync failed: ${JSON.stringify(market)}`);
const selected = [...market.products].sort((a, b) => b.opportunityScore - a.opportunityScore)[0];
if (!Number.isFinite(selected.opportunityScore) || !Number.isFinite(selected.grossMargin)) throw new Error("Deterministic metrics missing");

const analysisResponse = await fetch(`${base}/api/selection-analysis`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(selected) });
const analysis = await analysisResponse.json();
if (!analysisResponse.ok || !analysis.success || !analysis.analysis.verdict) throw new Error(`Selection analysis failed: ${JSON.stringify(analysis)}`);

const input = { name: selected.name, description: selected.description, costPrice: selected.costPrice, imageUrl: selected.imageUrl };

const agentResponse = await fetch(`${base}/api/agent`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
const agent = await agentResponse.json();
if (!agentResponse.ok || !agent.success || agent.steps.length !== 6) throw new Error(`Agent failed: ${JSON.stringify(agent)}`);

const publishResponse = await fetch(`${base}/api/publish-product`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(agent.draft) });
const published = await publishResponse.json();
if (!publishResponse.ok || !published.success) throw new Error(`Publish failed: ${JSON.stringify(published)}`);

const listResponse = await fetch(`${base}/api/products`);
const list = await listResponse.json();
if (!list.products.some((product) => product.productId === published.productId)) throw new Error("Published product not found in product list");
console.log(JSON.stringify({ synchronizedProducts: market.products.length, selected: { id: selected.id, name: selected.name, opportunityScore: selected.opportunityScore, grossMargin: selected.grossMargin }, selectionProvider: analysis.provider, agentSteps: agent.steps.length, allRulesPassed: agent.draft.ruleChecks.every((x) => x.passed), published, persistedProducts: list.products.length }, null, 2));
