import { promises as fs } from "fs";
import path from "path";
import { get, list, put } from "@vercel/blob";
import type { ProductDraft, PublishedProduct } from "./types";

export interface ProductRepository {
  list(): Promise<PublishedProduct[]>;
  publish(draft: ProductDraft): Promise<PublishedProduct>;
}

function createPublishedProduct(draft: ProductDraft): PublishedProduct {
  const now = new Date();
  return { ...draft, productId: `PRD-${now.getTime().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`, publishedAt: now.toISOString(), status: "published" };
}

function assertPublishable(draft: ProductDraft) {
  if (!draft || typeof draft !== "object") throw new Error("商品数据格式错误");
  if (!draft.title || draft.title.length > 80) throw new Error("商品标题不能为空且不能超过 80 字符");
  if (!draft.generatedDescription || draft.generatedDescription.length > 3000) throw new Error("商品描述不能为空且不能超过 3000 字符");
  if (!Array.isArray(draft.ruleChecks) || !draft.ruleChecks.length || !draft.ruleChecks.every((rule) => rule.passed)) throw new Error("规则检查未全部通过，不能发布");
}

export class LocalProductRepository implements ProductRepository {
  private readonly dataFile = path.join(process.cwd(), "data", "products.json");

  async list(): Promise<PublishedProduct[]> {
    try {
      return JSON.parse(await fs.readFile(this.dataFile, "utf8")) as PublishedProduct[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  async publish(draft: ProductDraft): Promise<PublishedProduct> {
    assertPublishable(draft);
    const products = await this.list();
    const product = createPublishedProduct(draft);
    products.unshift(product);
    await fs.mkdir(path.dirname(this.dataFile), { recursive: true });
    await fs.writeFile(this.dataFile, JSON.stringify(products, null, 2), "utf8");
    return product;
  }
}

export class ProductionProductRepository implements ProductRepository {
  async list(): Promise<PublishedProduct[]> {
    const products: PublishedProduct[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: "products/", cursor, limit: 100 });
      const pageProducts = await Promise.all(page.blobs.map(async (blob) => {
        const result = await get(blob.url, { access: "private" });
        if (!result || result.statusCode !== 200 || !result.stream) return null;
        return new Response(result.stream).json() as Promise<PublishedProduct>;
      }));
      products.push(...pageProducts.filter((product): product is PublishedProduct => product !== null));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return products.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  async publish(draft: ProductDraft): Promise<PublishedProduct> {
    assertPublishable(draft);
    const product = createPublishedProduct(draft);
    await put(`products/${product.productId}.json`, JSON.stringify(product), { access: "private", addRandomSuffix: false, contentType: "application/json" });
    return product;
  }
}

export function getProductRepository(): ProductRepository {
  return process.env.VERCEL === "1" || process.env.PRODUCT_REPOSITORY === "blob" ? new ProductionProductRepository() : new LocalProductRepository();
}

export async function listProducts() { return getProductRepository().list(); }
export async function publishProduct(draft: ProductDraft) { return getProductRepository().publish(draft); }
