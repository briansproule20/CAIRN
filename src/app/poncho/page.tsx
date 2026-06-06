import Image from "next/image";
import { AppShell } from "@/components/app-shell";
import { PonchoWorkspace } from "@/components/poncho-workspace";

export const metadata = {
  title: "Poncho · CAIRN",
};

export default function PonchoPage() {
  return (
    <AppShell title="Poncho">
      <header className="mb-8 flex items-start gap-4">
        <Image
          src="/poncho-mark.svg"
          alt="Poncho"
          width={52}
          height={54}
          priority
          className="mt-0.5 shrink-0"
        />
        <div>
          <h1 className="font-serif text-3xl text-text">Poncho</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
            Your hosted research agent — it researches, writes copy, and formats
            notes into clean vault entries. Send results straight to the editor.
          </p>
        </div>
      </header>

      <PonchoWorkspace />
    </AppShell>
  );
}
