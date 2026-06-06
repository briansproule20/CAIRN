import type { Metadata } from "next";
import "./globals.css";

// Resolve the real deployment origin so absolute OG image URLs point at THIS
// site (Vercel injects these automatically). A hardcoded fallback domain made
// crawlers fetch the OG image from the wrong host.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CAIRN",
  description: "Curated Archive of Interactive Records and Notes",
  robots: "noindex, nofollow",
  openGraph: {
    type: "website",
    title: "CAIRN",
    description: "Curated Archive of Interactive Records and Notes",
    siteName: "CAIRN",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "CAIRN",
    description: "Curated Archive of Interactive Records and Notes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans">
      <body className="min-h-screen bg-base text-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
