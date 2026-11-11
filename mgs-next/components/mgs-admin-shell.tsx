import { ArrowUpRight, Check, CircleAlert, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { MgsAdminSetupStatus } from "@/lib/mgs-admin-auth";
import type { MgsContentStoreStatus } from "@/lib/mgs-content-store";
import "@/app/admin/admin-ui.css";
import { MgsAdminLogoutButton } from "./mgs-admin-logout-button";
import { MgsAdminMotion, MgsAdminNavigation } from "./mgs-admin-navigation";

type MgsAdminShellProps = {
  section: "dashboard" | "projects" | "media" | "enquiries";
  title: string;
  description: string;
  setupStatus: MgsAdminSetupStatus;
  storageStatus: MgsContentStoreStatus;
  children: ReactNode;
  actions?: ReactNode;
};

export function MgsAdminShell({ section, title, description, setupStatus, storageStatus, children, actions }: MgsAdminShellProps) {
  return <MgsAdminMotion>
    <main className="admin-ui min-h-screen bg-[#0b0b0d] text-[#f6ecdd]">
      <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-lg focus:bg-white focus:p-3 focus:text-black">Skip to content</a>
      <div className="mx-auto grid min-h-screen max-w-[1920px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-white/[0.07] bg-[#101012] px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0 lg:py-7">
          <div className="flex h-full items-center justify-between gap-5 lg:flex-col lg:items-stretch lg:justify-start">
            <Link href="/admin" className="flex items-center gap-3 px-2 lg:mb-8" aria-label="Madibaev Studio admin home">
              <Image alt="Madibaev Graphic Studio" height={34} priority src="/mgs-logo.svg" width={100} />
              <span className="rounded-md border border-white/10 px-2 py-1 text-[9px] font-semibold tracking-[.12em] text-[#aaa6a0]">ADMIN</span>
            </Link>
            <MgsAdminNavigation section={section} />
            <div className="mt-auto hidden space-y-5 lg:block">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 text-xs font-medium"><span className={`size-1.5 rounded-full ${storageStatus.connected ? "bg-emerald-400" : "bg-amber-300"}`} />{storageStatus.connected ? "Storage connected" : "Storage unavailable"}</div>
                <p className="mt-2 text-xs leading-5 text-[#8e8a86]">{storageStatus.connected ? "Your workspace is ready. Saved content appears on the website." : "Connect storage to save changes."}</p>
              </div>
              <Link className="admin-nav-link" href="/" target="_blank">Open website <ArrowUpRight className="ml-auto" size={16} aria-hidden="true" /></Link>
              <div className="flex items-center justify-between border-t border-white/[0.07] px-2 pt-5"><span className="flex items-center gap-2 text-xs text-[#aaa6a0]"><ShieldCheck size={15} aria-hidden="true" /> Owner</span><MgsAdminLogoutButton /></div>
            </div>
          </div>
        </aside>
        <section className="min-w-0 pb-12">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/[0.07] px-5 text-xs text-[#8e8a86] lg:px-9">
            <span>Workspace <span aria-hidden="true" className="mx-2 text-white/20">/</span><span className="capitalize text-[#d6cdc4]">{section === "dashboard" ? "Overview" : section}</span></span>
            <span className="hidden items-center gap-1.5 sm:flex"><Check size={13} aria-hidden="true" /> Private workspace</span>
            <div className="lg:hidden"><MgsAdminLogoutButton /></div>
          </div>
          <header className="flex flex-col gap-5 px-5 pt-8 pb-7 sm:flex-row sm:items-center sm:justify-between lg:px-9 lg:pt-10">
            <div><p className="admin-kicker mb-2">Madibaev Graphic Studio</p><h1 className="text-[1.85rem] font-semibold tracking-[-.045em] text-[#fff7ee] sm:text-[2.2rem]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa6a0]">{description}</p></div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </header>
          <div id="admin-content" tabIndex={-1} className="space-y-6 px-5 outline-none lg:px-9">
            {!setupStatus.authConfigured || !storageStatus.connected ? <div role="status" className="flex gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-100"><CircleAlert size={18} className="mt-1 shrink-0" aria-hidden="true" /><div>{!setupStatus.authConfigured ? `Sign-in setup required: ${setupStatus.missingAuthEnv.join(", ")}. ` : ""}{!storageStatus.connected ? storageStatus.issue ?? "Storage is unavailable. Saving is disabled until it reconnects." : ""}</div></div> : null}
            {children}
          </div>
        </section>
      </div>
    </main>
  </MgsAdminMotion>;
}

export function MgsAdminPanel({ title, eyebrow, children, description }: { title: string; eyebrow: string; children: ReactNode; description?: string }) {
  return <section className="admin-panel"><div className="admin-panel-head"><p className="admin-kicker">{eyebrow}</p><h2 className="mt-1.5 text-lg font-semibold tracking-tight text-[#fff7ee]">{title}</h2>{description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-[#aaa6a0]">{description}</p> : null}</div><div className="p-4 sm:p-6">{children}</div></section>;
}

export function MgsAdminStatCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return <article className="admin-stat"><p className="pr-4 text-sm text-[#aaa6a0]">{label}</p><strong className="mt-4 block text-4xl font-medium tracking-[-.06em] text-[#fff7ee] tabular-nums">{value}</strong><p className="mt-3 text-xs leading-5 text-[#8e8a86]">{detail}</p></article>;
}
