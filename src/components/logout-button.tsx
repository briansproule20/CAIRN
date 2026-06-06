"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore — redirect regardless */
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={logout} disabled={busy}>
      <LogOut />
      {busy ? "Logging out…" : "Log out"}
    </Button>
  );
}

export default LogoutButton;
