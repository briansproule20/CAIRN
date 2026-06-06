import { ogCard, OG_SIZE } from "@/lib/og-card";

export const runtime = "nodejs";
export const alt = "CAIRN — field record of cairns";
export const size = OG_SIZE;
export const contentType = "image/png";

// The /cairn homage gets its own card — identical, with a special subtext.
export default function CairnOpengraphImage() {
  return ogCard("Field record of cairns");
}
