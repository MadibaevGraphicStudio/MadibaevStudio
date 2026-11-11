"use client";

import { Button } from "@animate-ui/react/primitives/buttons/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MgsAdminProjectCreateFormProps = {
  disabled: boolean;
};

export function MgsAdminProjectCreateForm({ disabled }: MgsAdminProjectCreateFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: "",
    titleRu: "",
    titleEn: "",
    year: String(new Date().getFullYear()),
    visual: "nava",
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2 xl:grid-cols-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (disabled || pending) return;

        setPending(true);
        setMessage(null);

        try {
          const response = await fetch("/api/admin/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(form),
          });
          const data = (await response.json().catch(() => null)) as { error?: string; project?: { slug: string } } | null;

          if (!response.ok || !data?.project) {
            setMessage(data?.error ?? "Unable to create the project.");
            return;
          }

          router.push(`/admin/projects/${data.project.slug}`);
          router.refresh();
        } catch {
          setMessage("Unable to connect. Check your connection and try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <label className="block min-w-0"><span className="mb-2 block text-xs font-medium text-[#c6b798]">URL slug</span>
      <input
        className="w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#fff7ee] outline-none placeholder:text-[#a99c90]"
        disabled={disabled || pending}
        onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
        aria-label="Project URL slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" title="Lowercase letters, numbers and hyphens" placeholder="slug"
        value={form.slug}
      />
      </label>
      <label className="block min-w-0"><span className="mb-2 block text-xs font-medium text-[#c6b798]">Title - Russian</span>
      <input
        className="w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#fff7ee] outline-none placeholder:text-[#a99c90]"
        disabled={disabled || pending}
        onChange={(event) => setForm((current) => ({ ...current, titleRu: event.target.value }))}
        aria-label="Title in Russian" required placeholder="Title RU"
        value={form.titleRu}
      />
      </label>
      <label className="block min-w-0"><span className="mb-2 block text-xs font-medium text-[#c6b798]">Title - English</span>
      <input
        className="w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#fff7ee] outline-none placeholder:text-[#a99c90]"
        disabled={disabled || pending}
        onChange={(event) => setForm((current) => ({ ...current, titleEn: event.target.value }))}
        aria-label="Title in English" required placeholder="Title EN"
        value={form.titleEn}
      />
      </label>
      <label className="block min-w-0"><span className="mb-2 block text-xs font-medium text-[#c6b798]">Year</span>
      <input
        className="w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#fff7ee] outline-none placeholder:text-[#a99c90]"
        disabled={disabled || pending}
        onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))}
        aria-label="Project year" required type="number" min="1900" max="2200" placeholder="Year"
        value={form.year}
      />
      </label>
      <label className="block min-w-0"><span className="mb-2 block text-xs font-medium text-[#c6b798]">Visual theme</span>
      <select aria-label="Visual theme"
        className="w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#fff7ee] outline-none"
        disabled={disabled || pending}
        onChange={(event) => setForm((current) => ({ ...current, visual: event.target.value }))}
        value={form.visual}
      >
        <option value="nava">nava</option>
        <option value="aria">aria</option>
        <option value="solo">solo</option>
        <option value="north">north</option>
      </select>
      </label>
      <Button
        className="min-h-11 self-end rounded-xl bg-[linear-gradient(120deg,#159bd3_0%,#e5097f_48%,#ffcf32_100%)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        disabled={disabled || pending}
        type="submit"
      >
        {pending ? "Creating..." : "Add project"}
      </Button>

      {message ? <p role="alert" className="sm:col-span-full text-sm text-amber-100">{message}</p> : null}
    </form>
  );
}
