import type { MarketProduct } from "./types";

export interface MarketDataSource {
  readonly name: string;
  fetchProducts(): Promise<MarketProduct[]>;
}

const demoProducts: MarketProduct[] = [
  { id: "MKT-001", name: "桌面小风扇", category: "家居电器", costPrice: 28, marketPrice: 59.9, sales30d: 1680, growth30d: 42, competitionLevel: "medium", returnRate: 3.2, description: "USB充电，三档风速，低噪运行，适合办公室与宿舍桌面使用" },
  { id: "MKT-002", name: "冰感防晒袖", category: "服饰配件", costPrice: 8.5, marketPrice: 29.9, sales30d: 2350, growth30d: 58, competitionLevel: "high", returnRate: 5.1, description: "冰丝透气面料，高弹不勒手臂，适合通勤、骑行和户外防晒" },
  { id: "MKT-003", name: "宠物除毛刷", category: "宠物用品", costPrice: 12, marketPrice: 39.9, sales30d: 1320, growth30d: 31, competitionLevel: "medium", returnRate: 2.8, description: "自清洁按键设计，圆头梳齿，适合猫狗日常浮毛清理" },
  { id: "MKT-004", name: "便携榨汁杯", category: "厨房电器", costPrice: 42, marketPrice: 99, sales30d: 890, growth30d: 19, competitionLevel: "high", returnRate: 8.6, description: "无线充电便携果汁杯，食品级杯体，适合健身与旅行场景" },
  { id: "MKT-005", name: "数据线收纳盒", category: "数码配件", costPrice: 6.8, marketPrice: 24.9, sales30d: 720, growth30d: 15, competitionLevel: "low", returnRate: 1.9, description: "分区收纳充电线、耳机和存储卡，小巧便携，桌面旅行均适用" },
  { id: "MKT-006", name: "车载手机支架", category: "汽车用品", costPrice: 18, marketPrice: 49.9, sales30d: 1540, growth30d: 23, competitionLevel: "high", returnRate: 6.4, description: "重力联动夹持，单手取放，适配多数车型出风口" },
  { id: "MKT-007", name: "厨房密封夹", category: "厨房用品", costPrice: 4.5, marketPrice: 19.9, sales30d: 610, growth30d: 12, competitionLevel: "low", returnRate: 1.3, description: "食品袋防潮密封夹，多尺寸组合，可重复使用" },
  { id: "MKT-008", name: "便携补光灯", category: "数码配件", costPrice: 32, marketPrice: 79.9, sales30d: 1180, growth30d: 36, competitionLevel: "medium", returnRate: 4.5, description: "手机夹持式补光灯，三色温多档亮度，适合直播、自拍与视频会议" },
  { id: "MKT-009", name: "鞋子清洁刷", category: "家居清洁", costPrice: 9.8, marketPrice: 29.9, sales30d: 970, growth30d: 27, competitionLevel: "low", returnRate: 2.1, description: "软硬双面刷头，适合运动鞋与日常鞋面清洁，握持省力" },
  { id: "MKT-010", name: "旅行分装瓶", category: "旅行用品", costPrice: 11, marketPrice: 35.9, sales30d: 1380, growth30d: 34, competitionLevel: "medium", returnRate: 3.7, description: "防漏按压式分装瓶套装，容量标识清晰，适合洗护用品旅行携带" },
];

export class DemoDataSource implements MarketDataSource {
  readonly name = "Demo Market Data";
  async fetchProducts() {
    await new Promise((resolve) => setTimeout(resolve, 260));
    return demoProducts;
  }
}

export class HttpDataSource implements MarketDataSource {
  readonly name = "HTTP Data Source";
  constructor(private readonly endpoint: string) {}
  async fetchProducts(): Promise<MarketProduct[]> {
    const response = await fetch(this.endpoint);
    if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`);
    return response.json() as Promise<MarketProduct[]>;
  }
}

export function getMarketDataSource(): MarketDataSource {
  return new DemoDataSource();
}
