import { ImageResponse } from "next/og";

/**
 * Shared CAIRN OG / share card. `ogCard(subtext)` renders the same designed
 * card with a swappable tagline so per-route variants (e.g. /cairn) stay
 * identical except for the subtext. EB Garamond wordmark + Inter tagline.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const GARAMOND_TTF =
  "https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-NfNUAw.ttf";
const INTER_TTF =
  "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf";

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Failed to fetch font ${url}: ${res.status}`);
  return res.arrayBuffer();
}

function CairnMark({ scale = 6 }: { scale?: number }) {
  return (
    <svg
      width={40 * scale}
      height={48 * scale}
      viewBox="0 0 40 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="20" cy="40" rx="13" ry="4" fill="#c8a87c" />
      <ellipse cx="20" cy="30" rx="10.5" ry="4" fill="#c8a87c" opacity="0.82" />
      <ellipse cx="20" cy="20" rx="8" ry="4" fill="#c8a87c" opacity="0.66" />
      <ellipse cx="20" cy="10" rx="5.5" ry="4" fill="#c8a87c" opacity="0.5" />
    </svg>
  );
}

export async function ogCard(subtext: string): Promise<ImageResponse> {
  const [garamond, inter] = await Promise.all([
    loadFont(GARAMOND_TTF),
    loadFont(INTER_TTF),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(900px 620px at 24% 60%, rgba(200,168,124,0.16), rgba(200,168,124,0) 62%), radial-gradient(1100px 800px at 80% 0%, rgba(216,189,151,0.07), rgba(20,20,20,0) 55%), linear-gradient(180deg, #141414 0%, #0a0a0a 100%)",
          fontFamily: "Inter",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 44,
            left: 44,
            right: 44,
            bottom: 44,
            border: "1px solid rgba(231,227,220,0.10)",
            borderRadius: 4,
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 78,
            left: 92,
            display: "flex",
            alignItems: "center",
            color: "#8b7355",
            fontSize: 20,
            letterSpacing: 8,
            textTransform: "uppercase",
            fontWeight: 400,
          }}
        >
          Field Archive
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            paddingLeft: 132,
            paddingRight: 92,
            gap: 88,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <CairnMark scale={6} />
            <div
              style={{
                marginTop: 10,
                width: 200,
                height: 1,
                display: "flex",
                background:
                  "linear-gradient(90deg, rgba(200,168,124,0) 0%, rgba(200,168,124,0.45) 50%, rgba(200,168,124,0) 100%)",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: "EB Garamond",
                fontSize: 176,
                lineHeight: 1,
                letterSpacing: 4,
                color: "#e7e3dc",
                display: "flex",
              }}
            >
              CAIRN
            </div>

            <div
              style={{
                marginTop: 30,
                display: "flex",
                alignItems: "center",
                gap: 18,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 2,
                  display: "flex",
                  backgroundColor: "#c8a87c",
                }}
              />
              <div
                style={{
                  fontSize: 26,
                  color: "#d8bd97",
                  letterSpacing: 1,
                  display: "flex",
                }}
              >
                {subtext}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 80,
            right: 96,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 9,
              display: "flex",
              backgroundColor: "rgba(200,168,124,1)",
            }}
          />
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: 7,
              display: "flex",
              backgroundColor: "rgba(200,168,124,0.7)",
            }}
          />
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: 5,
              display: "flex",
              backgroundColor: "rgba(200,168,124,0.45)",
            }}
          />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "EB Garamond", data: garamond, style: "normal", weight: 600 },
        { name: "Inter", data: inter, style: "normal", weight: 400 },
      ],
    }
  );
}
