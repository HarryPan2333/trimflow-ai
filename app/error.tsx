"use client";

import { useEffect } from "react";
import { useI18n } from "../components/providers/language-provider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    console.error("TrimFlow page error", error);
  }, [error]);

  return (
    <main
      role="alert"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f4f7f8",
        color: "#182a36",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
      }}
    >
      <section
        style={{
          width: "min(100%, 520px)",
          padding: 28,
          border: "1px solid #dfe7eb",
          borderRadius: 10,
          background: "#ffffff",
          boxShadow: "0 5px 18px rgba(21, 43, 56, 0.06)",
        }}
      >
        <p style={{ margin: "0 0 8px", color: "#176b94", fontWeight: 700 }}>
          TrimFlow AI
        </p>
        <h1 style={{ margin: 0, fontSize: 22 }}>{t("errors.pageTitle")}</h1>
        <p style={{ margin: "12px 0 20px", lineHeight: 1.7, color: "#6c7d88" }}>
          {t("errors.pageCopy")}
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
          {t("errors.reloadPage")}
        </button>
      </section>
    </main>
  );
}
