"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@animate-ui/react/primitives/buttons/button";

export function MgsAdminLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div>
    <Button
      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-[#f6ecdd] transition hover:border-white/20 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        setError(false);

        try {
          const response = await fetch("/api/admin/session", {
            method: "DELETE",
            credentials: "same-origin",
          });
          if (!response.ok) throw new Error("Sign out failed");
          router.replace("/admin/login");
          router.refresh();
        } catch {
          setError(true);
        } finally {
          setPending(false);
        }
      }}
      type="button"
    >
      {pending ? "Signing out..." : "Log out"}
    </Button>
    {error ? <p role="alert" className="mt-2 max-w-48 text-xs text-amber-200">Could not sign out. Please try again.</p> : null}
    </div>
  );
}
