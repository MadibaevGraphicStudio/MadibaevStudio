"use client";

import { Button } from "@animate-ui/react/primitives/buttons/button";
import { ArrowUpRight, FolderOpen, Search, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { MgsAdminProject } from "@/lib/mgs-content-store";

export function MgsAdminProjectList({ projects }: { projects: MgsAdminProject[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = projects.filter((project) => {
    const matches = [project.title.en, project.title.ru, project.client.en, project.client.ru, project.category.en, project.category.ru, project.slug].join(" ").toLowerCase().includes(query.trim().toLowerCase());
    return matches && (status === "all" || (status === "featured" ? project.featured : project.status === status));
  });

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="relative min-w-0 flex-1">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-[#a99c90]" />
        <span className="sr-only">Search projects</span>
        <input type="search" className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-3 text-sm text-[#fff7ee] placeholder:text-[#a99c90]" placeholder="Search by title, client or category…" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <label>
        <span className="sr-only">Filter projects</span>
        <select className="min-h-11 w-full rounded-xl border border-white/10 bg-[#151517] px-4 text-sm text-[#fff7ee] sm:w-44" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All projects</option><option value="published">Published</option><option value="draft">Drafts</option><option value="featured">Featured</option>
        </select>
      </label>
    </div>
    <div className="flex items-center justify-between gap-3 text-xs text-[#b7aa9d]">
      <p aria-live="polite">{filtered.length} of {projects.length} projects</p>
      {query || status !== "all" ? <Button type="button" className="rounded-lg px-3 py-2 text-[#f6ecdd] hover:bg-white/5" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Button> : null}
    </div>
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {filtered.map((project) => <Link key={project.slug} href={`/admin/projects/${project.slug}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] transition hover:border-white/25 hover:bg-white/[0.045]">
        <div aria-hidden="true" className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-[#19191c] bg-cover bg-center" style={{ backgroundImage: `url(${project.cover})` }}>
          <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/5" />
          <span className="relative text-7xl font-semibold tracking-[-0.12em] text-white drop-shadow-lg">{project.mark}</span>
          <span className={`absolute left-4 top-4 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-md ${project.status === "published" ? "border-emerald-300/25 bg-emerald-950/90 text-emerald-200" : "border-amber-300/25 bg-amber-950/90 text-amber-200"}`}>{project.status === "published" ? "Published" : "Draft"}</span>
          {project.featured ? <span className="absolute right-4 top-4 rounded-full bg-black/70 p-2 text-[#ffcf32]"><Star aria-label="Featured" className="size-3.5" /></span> : null}
        </div>
        <div className="p-5">
          <p className="text-xs text-[#a99c90]">{project.category.en} <span aria-hidden="true">·</span> {project.year}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-[#fff7ee]">{project.title.en}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#b7aa9d]">{project.summary.en}</p>
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs"><span className="truncate text-[#a99c90]">{project.client.en}</span><span className="ml-3 inline-flex shrink-0 items-center gap-1.5 font-medium text-[#f6ecdd]">Edit project <ArrowUpRight aria-hidden="true" className="size-4" /></span></div>
        </div>
      </Link>)}
    </div>
    {!filtered.length ? <div className="rounded-2xl border border-dashed border-white/15 px-5 py-14 text-center"><FolderOpen aria-hidden="true" className="mx-auto size-8 text-[#c6b798]" /><h3 className="mt-4 font-medium text-[#fff7ee]">{projects.length ? "No matching projects" : "Your portfolio starts here"}</h3><p className="mt-2 text-sm text-[#b7aa9d]">{projects.length ? "Try another search or clear the filters." : "Use Add project above to create your first case study."}</p></div> : null}
  </div>;
}
