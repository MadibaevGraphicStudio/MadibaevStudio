"use client";

import { Dialog } from "@animate-ui/react/primitives/radix-ui";
import { AnimateUIProvider } from "@animate-ui/react/provider";
import { ArrowUpRight, ChevronRight, FolderOpen, Images, Inbox, LayoutDashboard, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

const items = [
  { key: "dashboard", href: "/admin", label: "Overview", icon: LayoutDashboard },
  { key: "projects", href: "/admin/projects", label: "Projects", icon: FolderOpen },
  { key: "media", href: "/admin/media", label: "Media library", icon: Images },
  { key: "enquiries", href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
] as const;

export function MgsAdminMotion({ children }: { children: ReactNode }) {
  return <AnimateUIProvider tempo={0.8} reducedMotion="user">{children}</AnimateUIProvider>;
}

export function MgsAdminNavigation({ section }: { section: string }) {
  const [open, setOpen] = useState(false);
  const links = <nav aria-label="Admin navigation" className="grid gap-1.5">{items.map(({ key, href, label, icon: Icon }) => (
    <Link key={key} href={href} aria-current={key === section ? "page" : undefined} onClick={() => setOpen(false)} className={`admin-nav-link ${key === section ? "is-active" : ""}`}>
      <Icon size={18} aria-hidden="true" /><span>{label}</span><ChevronRight size={14} className="ml-auto opacity-40" aria-hidden="true" />
    </Link>
  ))}</nav>;

  return <>
    <div className="hidden lg:block"><p className="admin-kicker mb-3 px-3">Workspace</p>{links}</div>
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="admin-mobile-toggle lg:hidden"><Menu size={18} aria-hidden="true" /> Menu</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="admin-ui fixed inset-y-0 left-0 z-[101] w-[min(320px,90vw)] overflow-y-auto border-r border-white/10 bg-[#101012] p-6 text-[#f6ecdd]">
          <div className="mb-8 flex items-center justify-between"><Dialog.Title className="font-semibold">Studio workspace</Dialog.Title><Dialog.Close aria-label="Close navigation" className="rounded-lg p-2 hover:bg-white/10"><X size={20} /></Dialog.Close></div>
          <Dialog.Description className="sr-only">Navigate between admin sections.</Dialog.Description>
          {links}
          <Link href="/" target="_blank" className="admin-nav-link mt-6">Open website <ArrowUpRight size={16} /></Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
