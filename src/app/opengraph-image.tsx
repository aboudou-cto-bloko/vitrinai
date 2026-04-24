import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VitrinAI — Diagnostic de présence digitale pour l'Afrique de l'Ouest";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1c1c1b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "#2d7a4f" }} />

        {/* Background texture dots */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, #2d2d2b 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.4,
        }} />

        {/* Glow */}
        <div style={{
          position: "absolute",
          top: "-80px", left: "50%",
          transform: "translateX(-50%)",
          width: "600px", height: "400px",
          background: "radial-gradient(ellipse, #2d7a4f22 0%, transparent 70%)",
        }} />

        {/* Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#2d7a4f18",
          border: "1px solid #2d7a4f44",
          borderRadius: "100px",
          padding: "8px 20px",
          marginBottom: "28px",
          zIndex: 1,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d7a4f" }} />
          <span style={{ color: "#2d7a4f", fontSize: "13px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Conçu pour l&apos;Afrique de l&apos;Ouest
          </span>
        </div>

        {/* Brand name */}
        <div style={{
          color: "#f0ede4",
          fontSize: "88px",
          fontWeight: 800,
          letterSpacing: "-3px",
          lineHeight: 1,
          marginBottom: "20px",
          zIndex: 1,
        }}>
          VitrinAI
        </div>

        {/* Tagline */}
        <div style={{
          color: "#87867f",
          fontSize: "26px",
          textAlign: "center",
          maxWidth: "680px",
          lineHeight: 1.45,
          marginBottom: "44px",
          zIndex: 1,
        }}>
          Diagnostic complet de présence digitale en 30 secondes — SEO, performance, réseaux sociaux
        </div>

        {/* Score pills */}
        <div style={{ display: "flex", gap: "12px", zIndex: 1 }}>
          {[
            { label: "Technique", pts: "30 pts" },
            { label: "SEO", pts: "30 pts" },
            { label: "Présence", pts: "25 pts" },
            { label: "Expérience", pts: "15 pts" },
          ].map(({ label, pts }) => (
            <div key={label} style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "#252524",
              border: "1px solid #2e2e2c",
              borderRadius: "14px",
              padding: "14px 22px",
            }}>
              <span style={{ color: "#f0ede4", fontSize: "15px", fontWeight: 600 }}>{label}</span>
              <span style={{ color: "#2d7a4f", fontSize: "13px", fontWeight: 500, marginTop: "2px" }}>{pts}</span>
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div style={{
          position: "absolute",
          bottom: "32px",
          color: "#3a3830",
          fontSize: "15px",
          letterSpacing: "0.5px",
          zIndex: 1,
        }}>
          vitrinai.com
        </div>
      </div>
    ),
    { ...size }
  );
}
