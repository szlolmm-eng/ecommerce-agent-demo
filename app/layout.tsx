import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "商品上架 AI Agent", description: "电商商品自动上架演示" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-600">Commerce Ops</p><h1 className="text-lg font-bold">商品上架 AI Agent</h1></div>
            <nav className="flex gap-2 text-sm font-medium"><Link className="rounded-lg px-4 py-2 hover:bg-slate-100" href="/selection">选品中心</Link><Link className="rounded-lg px-4 py-2 hover:bg-slate-100" href="/">Agent 工作台</Link><Link className="rounded-lg px-4 py-2 hover:bg-slate-100" href="/products">已上架商品</Link></nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
