"use client";

import { ArrowUpRight, Inbox, LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@animate-ui/react/primitives/buttons/button";
import { Dialog } from "@animate-ui/react/primitives/radix-ui";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MgsEnquiry, MgsEnquiryStatus } from "@/lib/mgs-content-store";

type MgsAdminEnquiryListProps = {
  enquiries: readonly MgsEnquiry[];
  disabled: boolean;
};

type EnquiryFilter = "all" | MgsEnquiryStatus;

const statusLabels: Record<MgsEnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  in_discussion: "In discussion",
  accepted: "Accepted",
  declined: "Declined",
};

const statusStyles: Record<MgsEnquiryStatus, string> = {
  new: "border-sky-300/25 bg-sky-400/10 text-sky-200",
  contacted: "border-violet-300/25 bg-violet-400/10 text-violet-200",
  in_discussion: "border-amber-300/25 bg-amber-400/10 text-amber-200",
  accepted: "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
  declined: "border-rose-300/25 bg-rose-400/10 text-rose-200",
};

const filters: { value: EnquiryFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...Object.entries(statusLabels).map(([value, label]) => ({ value: value as MgsEnquiryStatus, label })),
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export function MgsAdminEnquiryList({ enquiries, disabled }: MgsAdminEnquiryListProps) {
  const router = useRouter();
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EnquiryFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pendingSet = useMemo(() => new Set(pendingIds), [pendingIds]);
  const filteredEnquiries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return enquiries.filter((enquiry) => {
      const matchesFilter = filter === "all" || enquiry.status === filter;
      const searchText = [enquiry.name, enquiry.email, enquiry.company, enquiry.contact, enquiry.projectType, enquiry.message].join(" ").toLowerCase();
      return matchesFilter && (!normalizedQuery || searchText.includes(normalizedQuery));
    });
  }, [enquiries, filter, query]);

  const selectedEnquiry = selectedId ? enquiries.find((item) => item.id === selectedId) ?? null : null;

  async function updateStatus(enquiry: MgsEnquiry, status: string) {
    setPendingIds((current) => [...current, enquiry.id]);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/enquiries/${enquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Unable to update the enquiry.");
        return;
      }

      router.refresh();
      setMessage(`Status updated to ${statusLabels[status as MgsEnquiryStatus].toLowerCase()}.`);
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setPendingIds((current) => current.filter((item) => item !== enquiry.id));
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search enquiries</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#c6b798]" />
            <Input
              className="h-11 rounded-xl border-white/10 bg-white/[0.035] py-3 pl-11 pr-4 text-sm text-[#fff7ee] placeholder:text-[#a99c90] focus-visible:border-white/25 focus-visible:ring-white/10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, company..."
              value={query}
            />
          </label>
          <p aria-live="polite" className="flex shrink-0 items-center gap-2 text-xs text-[#c6b798]"><SlidersHorizontal aria-hidden="true" className="size-3.5" /> {filteredEnquiries.length} of {enquiries.length} enquiries</p>
        </div>
        <Tabs className="mt-4" onValueChange={(value) => setFilter(value as EnquiryFilter)} value={filter}>
          <TabsList aria-label="Filter enquiries by status" className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.035] p-1">
          {filters.map((item) => {
            const active = item.value === filter;
            const count = item.value === "all" ? enquiries.length : enquiries.filter((enquiry) => enquiry.status === item.value).length;

            return (
              <TabsTrigger
                className={`h-9 rounded-lg px-3 text-xs font-semibold ${active ? "bg-white/[0.12] text-[#fff7ee]" : "text-[#c6b798] hover:text-[#fff7ee]"}`}
                key={item.value}
                value={item.value}
              >
                {item.label} <span className="ml-1 opacity-60">{count}</span>
              </TabsTrigger>
            );
          })}
          </TabsList>
        </Tabs>
      </div>

      {message ? <p className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100" role="status">{message}</p> : null}

      {!enquiries.length ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-8 text-center">
          <Inbox aria-hidden="true" className="mx-auto mb-4 size-8 text-[#c6b798]" />
          <p className="text-lg font-semibold text-[#fff7ee]">No enquiries yet.</p>
          <p className="mt-2 text-sm leading-6 text-[#b7aa9d]">New briefs from the public contact form will appear here.</p>
        </div>
      ) : !filteredEnquiries.length ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-8 text-center">
          <p className="text-lg font-semibold text-[#fff7ee]">No matching enquiries.</p>
          <Button className="mt-4 min-h-10 rounded-xl border border-white/15 px-4 text-sm text-[#f6ecdd] hover:bg-white/5" onClick={() => { setQuery(""); setFilter("all"); }} type="button">Clear filters</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEnquiries.map((enquiry) => {
            const isPending = pendingSet.has(enquiry.id);

            return (
              <article aria-busy={isPending} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-white/20" key={enquiry.id}>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <button aria-label={`View enquiry from ${enquiry.name}`} className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#c6b798] focus-visible:ring-offset-4 focus-visible:ring-offset-[#111]" onClick={() => setSelectedId(enquiry.id)} type="button">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`h-auto rounded-full px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] ${statusStyles[enquiry.status]}`} variant="outline">{statusLabels[enquiry.status]}</Badge>
                      <span className="text-[0.68rem] uppercase tracking-[0.16em] text-[#c6b798]">{formatDate(enquiry.createdAt)}</span>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#fff7ee]">{enquiry.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#b7aa9d]">{enquiry.email}{enquiry.company ? ` · ${enquiry.company}` : ""}{enquiry.contact ? ` · ${enquiry.contact}` : ""}</p>
                    <p className="mt-3 line-clamp-3 max-w-4xl text-sm leading-7 text-[#efe1cf]">{enquiry.message}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[#c6b798]">{enquiry.projectType || "General brief"}{enquiry.budget ? ` · ${enquiry.budget}` : ""}{enquiry.deadline ? ` · Due ${enquiry.deadline}` : ""}</p>
                  </button>

                  <div className="flex shrink-0 flex-col gap-3 xl:min-w-[220px]">
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">Pipeline status</span>
                      <select className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-[#fff7ee] outline-none focus:border-white/25" disabled={disabled || isPending} onChange={(event) => updateStatus(enquiry, event.target.value)} value={enquiry.status}>
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <Button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-[#f6ecdd] transition hover:border-white/20 hover:bg-white/[0.06]" onClick={() => setSelectedId(enquiry.id)} type="button">View details <ArrowUpRight aria-hidden="true" className="size-3.5" /></Button>
                    {isPending ? <p className="flex items-center gap-2 text-xs text-[#c6b798]" role="status"><LoaderCircle aria-hidden="true" className="size-3.5 motion-safe:animate-spin" /> Saving status…</p> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog.Root onOpenChange={(open) => { if (!open) setSelectedId(null); }} open={Boolean(selectedEnquiry)}>
        <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="admin-ui fixed inset-y-0 right-0 z-[101] flex w-full flex-col border-l border-white/10 bg-[#111113] p-0 text-[#f6ecdd] shadow-2xl outline-none sm:max-w-xl">
          <Dialog.Close aria-label="Close enquiry" className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-xl border border-white/10 text-[#c6b798] hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#c6b798]"><X aria-hidden="true" className="size-4" /></Dialog.Close>
          {selectedEnquiry ? <>
            <div className="space-y-2 border-b border-white/10 p-6 pr-16">
              <Dialog.Title className="text-left text-3xl font-semibold tracking-[-0.05em] text-[#fff7ee]">{selectedEnquiry.name}</Dialog.Title>
              <Dialog.Description className="text-left text-sm text-[#b7aa9d]">Enquiry detail · {formatDate(selectedEnquiry.createdAt)}</Dialog.Description>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">

            <div className="grid gap-3 sm:grid-cols-2">
              {[["Email", selectedEnquiry.email, `mailto:${selectedEnquiry.email}`], ["Company", selectedEnquiry.company || "—", null], ["Contact", selectedEnquiry.contact || "—", null], ["Project type", selectedEnquiry.projectType || "—", null], ["Budget", selectedEnquiry.budget || "—", null], ["Deadline", selectedEnquiry.deadline || "—", null]].map(([label, value, href]) => (
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4" key={label}>
                  <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#c6b798]">{label}</p>
                  {href ? <a className="mt-2 block break-all text-sm text-[#fff7ee] underline decoration-white/20 underline-offset-4" href={href}>{value}</a> : <p className="mt-2 text-sm text-[#fff7ee]">{value}</p>}
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#c6b798]">Message</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#efe1cf]">{selectedEnquiry.message}</p>
            </div>

            <div className="mt-auto pt-6">
              {message ? <p className="mb-4 text-sm text-[#c6b798]" role="status">{message}</p> : null}
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">Move through pipeline</span>
                <select className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-[#fff7ee] outline-none" disabled={disabled || pendingSet.has(selectedEnquiry.id)} onChange={(event) => updateStatus(selectedEnquiry, event.target.value)} value={selectedEnquiry.status}>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
            </div>
          </> : null}
        </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
