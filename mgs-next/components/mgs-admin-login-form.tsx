"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@animate-ui/react/primitives/buttons/button";

type MgsAdminLoginFormProps = {
  disabled: boolean;
};

export function MgsAdminLoginForm({ disabled }: MgsAdminLoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <form
      aria-busy={pending}
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (disabled || pending) return;

        setPending(true);
        setMessage(null);

        try {
          const response = await fetch("/api/admin/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ password }),
          });
          const data = (await response.json().catch(() => null)) as { error?: string } | null;

          if (!response.ok) {
            setMessage(data?.error ?? "Unable to sign in.");
            return;
          }

          router.replace("/admin");
          router.refresh();
        } catch {
          setMessage("Connection failed. Check your connection and try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-[#f6ecdd]" htmlFor="admin-password">Admin password</label>
        <div className="relative">
        <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#a99c90]" />
        <input
          aria-describedby={message ? "admin-login-error" : undefined}
          aria-invalid={Boolean(message)}
          autoComplete="current-password"
          className="min-h-12 w-full rounded-xl border border-white/12 bg-black/25 py-3 pl-11 pr-14 text-base text-[#fff7ee] outline-none transition placeholder:text-[#a99c90] focus:border-[#c6b798] focus:ring-2 focus:ring-[#c6b798]/15"
          disabled={disabled || pending}
          id="admin-password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter the owner password"
          required
          type={visible ? "text" : "password"}
          value={password}
        />
        <Button aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} className="absolute right-1.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#b7aa9d] hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[#c6b798]" disabled={disabled || pending} onClick={() => setVisible((current) => !current)} type="button">
          {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
        </Button>
        </div>
      </div>

      <Button
        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#f2e7d7] px-6 text-sm font-semibold text-[#171412] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c6b798] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || pending || !password.trim()}
        type="submit"
      >
        {pending ? "Signing in..." : "Open admin"}
        {pending ? <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <ArrowRight aria-hidden="true" className="size-4" />}
      </Button>

      {message ? <p className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100" id="admin-login-error" role="alert">{message}</p> : null}
    </form>
  );
}
