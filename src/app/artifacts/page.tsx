import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ArtifactGallery } from "@/components/artifacts/artifact-gallery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Artifacts · CAIRN" };

/**
 * Artifacts — an ephemeral holding pen for media Poncho generates. Items live
 * here only until they're saved into the vault (or discarded); nothing here is
 * permanent. Promote with "Save to Vault" or remove with "Discard".
 */
export default function ArtifactsPage() {
  return (
    <AppShell
      title="Artifacts"
      breadcrumb={
        <Link href="/" className="text-muted transition-colors hover:text-text">
          Vault
        </Link>
      }
    >
      <header className="mb-8 space-y-2">
        <h1 className="font-serif text-3xl text-text">Artifacts</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          A holding pen for media Poncho generates. These are{" "}
          <span className="text-accent-soft">ephemeral</span> — save one to the
          vault to keep it, or discard it. Anything left here may be cleared.
        </p>
      </header>

      <ArtifactGallery />
    </AppShell>
  );
}
