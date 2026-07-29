import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrimFlow AI｜服装辅料外贸销售助手",
  description: "面向服装辅料外贸销售团队的 AI 客户项目管理工作台原型。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
