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
    if (typeof console !== "undefined") {
      console.error("[global-error]", error);
    }
  }, [error]);

  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#000",
          color: "#e6f4ea",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, sans-serif",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 640, width: "100%" }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#39ff9c",
              margin: 0,
            }}
          >
            Something broke
          </p>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              marginTop: 6,
              marginBottom: 12,
            }}
          >
            The app hit an unexpected error.
          </h1>
          <pre
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: 16,
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "#fff5c2",
            }}
          >
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
            {error.stack ? `\n\n${error.stack}` : ""}
          </pre>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              background: "#39ff9c",
              color: "#000",
              border: 0,
              borderRadius: 999,
              padding: "10px 18px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
