import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "星罗618品牌PK看板",
  description: "618期间品牌GMV实时排行榜",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
