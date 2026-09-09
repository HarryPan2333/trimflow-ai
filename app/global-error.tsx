"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("TrimFlow global error", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          boxSizing: "border-box",
          background: "#f4f7f8",
          color: "#182a36",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
        }}
      >
        <main role="alert" style={{ width: "min(100%, 520px)" }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>TrimFlow AI 加载失败</h1>
          <p style={{ margin: "12px 0 20px", lineHeight: 1.7, color: "#6c7d88" }}>
            应用遇到意外错误。请检查网络连接后重试。
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 38,
              padding: "8px 16px",
              border: 0,
              borderRadius: 6,
              background: "#176b94",
              color: "#ffffff",
              font: "inherit",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            重新加载
          </button>
        </main>
      </body>
    </html>
  );
}
