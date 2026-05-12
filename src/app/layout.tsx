import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAIRN",
  description: "Curated Archive of Interactive Records and Notes",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
