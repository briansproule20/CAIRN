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
    <html lang="en" className="font-sans">
      <body className="min-h-screen bg-base text-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
