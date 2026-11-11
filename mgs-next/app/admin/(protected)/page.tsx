import Link from "next/link";
import { ArrowUpRight, FolderOpen, Images, Inbox, Plus } from "lucide-react";

import { MgsAdminPanel, MgsAdminShell, MgsAdminStatCard } from "@/components/mgs-admin-shell";
import { getMgsAdminSetupStatus } from "@/lib/mgs-admin-auth";
import { getMgsContentStoreStatus, listMgsAdminProjects, listMgsEnquiries } from "@/lib/mgs-content-store";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [projectsData, enquiriesData] = await Promise.all([listMgsAdminProjects(), listMgsEnquiries()]);
  const setupStatus = getMgsAdminSetupStatus();
  const storageStatus = projectsData.status.connected ? projectsData.status : getMgsContentStoreStatus();
  const published = projectsData.projects.filter((project) => project.status === "published");
  const drafts = projectsData.projects.filter((project) => project.status === "draft");
  const featured = projectsData.projects.filter((project) => project.featured);
  const freshEnquiries = enquiriesData.enquiries.filter((enquiry) => enquiry.status === "new");

  return (
    <MgsAdminShell
      actions={
        <div className="flex flex-wrap gap-2">
          <Link className="admin-primary" href="/admin/projects#create-project">
            <Plus size={16} aria-hidden="true" /> Add project
          </Link>
          <Link className="admin-secondary" href="/admin/enquiries">
            <Inbox size={16} aria-hidden="true" /> Inbox
          </Link>
        </div>
      }
      description="Your studio at a glance. Manage your work, keep the portfolio fresh and follow up with new clients."
      section="dashboard"
      setupStatus={setupStatus}
      storageStatus={storageStatus}
      title="Studio overview"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MgsAdminStatCard detail="Projects currently visible on the public site." label="Published work" value={published.length} />
        <MgsAdminStatCard detail="Entries still waiting for publication." label="Draft queue" value={drafts.length} />
        <MgsAdminStatCard detail="Cards highlighted on the homepage and selected work." label="Featured cases" value={featured.length} />
        <MgsAdminStatCard detail="Fresh enquiries from the public contact form." label="New enquiries" value={freshEnquiries.length} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { href: "/admin/projects", icon: FolderOpen, title: "Manage portfolio", detail: "Edit, publish and organise your work" },
          { href: "/admin/media", icon: Images, title: "Upload media", detail: "Keep project assets in one place" },
          { href: "/admin/enquiries", icon: Inbox, title: "Review enquiries", detail: `${freshEnquiries.length} new enquiries to follow up` },
        ].map(({ href, icon: Icon, title, detail }) => <Link href={href} key={href} className="admin-panel group flex items-center gap-4 p-5 transition hover:border-white/25"><span className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[#e9b3ce]"><Icon size={20} aria-hidden="true" /></span><span className="min-w-0 flex-1"><strong className="block text-sm font-medium">{title}</strong><span className="mt-1 block text-xs leading-5 text-[#aaa6a0]">{detail}</span></span><ArrowUpRight size={16} className="text-[#8e8a86] transition group-hover:text-white" aria-hidden="true" /></Link>)}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.95fr]">
        <MgsAdminPanel
          description="Pick a project to continue editing its story and visuals."
          eyebrow="Content"
          title="Recent projects"
        >
          <div className="grid gap-3">
            {[...projectsData.projects].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 4).map((project) => (
              <Link
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/[0.05] md:flex-row md:items-center md:justify-between"
                href={`/admin/projects/${project.slug}`}
                key={project.slug}
              >
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[#a99c90]">
                    {project.sequence} / {project.category.en} / {project.year}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#fff7ee]">{project.title.en}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#b7aa9d]">{project.summary.en}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-[#c6b798]">
                  {project.status === "published" ? "Published" : "Draft"}
                </span>
              </Link>
            ))}
            {!projectsData.projects.length ? <div className="admin-empty"><FolderOpen size={28} aria-hidden="true" /><p>Your portfolio starts here.</p><Link href="/admin/projects#create-project" className="admin-secondary">Add your first project</Link></div> : null}
            {projectsData.projects.length ? <Link href="/admin/projects" className="admin-secondary mt-2">View all projects <ArrowUpRight size={14} aria-hidden="true" /></Link> : null}
          </div>
        </MgsAdminPanel>

        <MgsAdminPanel
          description="Recent conversations from your website contact form."
          eyebrow="Inbox"
          title="Latest enquiries"
        >
          <div className="grid gap-3">
            {[...enquiriesData.enquiries].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 4).map((enquiry) => (
                <article className="rounded-xl border border-white/10 bg-black/20 p-4" key={enquiry.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-[#c6b798]">
                    {enquiry.status.replaceAll("_", " ")}
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-[#a99c90]">
                    {new Date(enquiry.createdAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[#fff7ee]">{enquiry.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[#b7aa9d]">{enquiry.email}</p>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#efe1cf]">{enquiry.message}</p>
              </article>
            ))}
            {!enquiriesData.enquiries.length ? (
              <div className="admin-empty"><Inbox size={28} aria-hidden="true" /><p>You’re all caught up.</p><p className="max-w-xs text-xs leading-5">New messages from your website will appear here.</p></div>
            ) : null}
            {enquiriesData.enquiries.length ? <Link href="/admin/enquiries" className="admin-secondary mt-2">Open inbox <ArrowUpRight size={14} aria-hidden="true" /></Link> : null}
          </div>
        </MgsAdminPanel>
      </div>
    </MgsAdminShell>
  );
}
