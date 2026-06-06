import { ogCard, OG_SIZE } from "@/lib/og-card";

export const runtime = "nodejs";
export const alt = "CAIRN — Curated Archive of Interactive Records and Notes";
export const size = OG_SIZE;
export const contentType = "image/png";

// The general card shown on every route except /cairn.
export default function OpengraphImage() {
  return ogCard("Curated Archive of Interactive Records & Notes");
}
