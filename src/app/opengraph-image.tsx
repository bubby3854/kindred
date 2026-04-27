import { ImageResponse } from "next/og";

export const alt = "kindred — 내가 만든 웹앱을 보여주는 곳";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#0e0e10",
          color: "#f6f5f0",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#9b9991",
          }}
        >
          kindred
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 88,
              lineHeight: 1.05,
              fontFamily: "serif",
              fontStyle: "italic",
            }}
          >
            내가 만든 웹앱,
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              lineHeight: 1.05,
              fontFamily: "serif",
              fontStyle: "italic",
              gap: 18,
            }}
          >
            <span style={{ color: "#d97706" }}>제대로</span>
            <span>보여주기.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#9b9991",
              maxWidth: 900,
              marginTop: 8,
            }}
          >
            소유권 인증된 라이브 웹앱이 머무는 자리.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
