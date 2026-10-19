import { ImageResponse } from "next/og";

export const alt = "Whyboard — stop guessing why you're not getting hired";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08080a",
          padding: "72px 80px",
          color: "#f2f2f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 34 }}>
            <div style={{ width: 9, height: 14, background: "#ffc857", opacity: 0.45, borderRadius: 2 }} />
            <div style={{ width: 9, height: 23, background: "#ffc857", opacity: 0.72, borderRadius: 2 }} />
            <div style={{ width: 9, height: 34, background: "#ffc857", borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 30, letterSpacing: -0.5 }}>whyboard</div>
          <div
            style={{
              marginLeft: 8,
              fontSize: 16,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#8b8b99",
              border: "1px solid #23232c",
              borderRadius: 999,
              padding: "6px 14px",
            }}
          >
            jobseeker
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 72, lineHeight: 1.03, letterSpacing: -3, maxWidth: 940 }}>
            Stop guessing why you&apos;re not getting hired.
          </div>
          <div style={{ fontSize: 28, color: "#8b8b99", maxWidth: 840, lineHeight: 1.4 }}>
            An AI detective for your job search. CSV in, evidence-backed story out —
            with every query attached.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 20, color: "#5d5d6b" }}>
          <div style={{ width: 8, height: 8, borderRadius: 999, background: "#ffc857" }} />
          read-only by design · never stores your file
        </div>
      </div>
    ),
    size,
  );
}
