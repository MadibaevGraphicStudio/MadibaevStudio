import { MgsAdminProjectList } from "@/components/mgs-admin-project-list";

import { MgsAdminProjectCreateForm } from "@/components/mgs-admin-project-create-form";
import { MgsAdminPanel, MgsAdminShell, MgsAdminStatCard } from "@/components/mgs-admin-shell";
import { getMgsAdminSetupStatus } from "@/lib/mgs-admin-auth";
import { listMgsAdminProjects } from "@/lib/mgs-content-store";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const setupStatus = getMgsAdminSetupStatus();
  const projectsData = await listMgsAdminProjects();
  const published = projectsData.projects.filter((project) => project.status === "published");
  const featured = projectsData.projects.filter((project) => project.featured);

  return (
    <MgsAdminShell
      description="Create and maintain the project cards that feed the homepage, the work archive, and every public case-study route."
      section="projects"
      setupStatus={setupStatus}
      storageStatus={projectsData.status}
      title="Project library"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MgsAdminStatCard detail="All known case-study entries." label="Total projects" value={projectsData.projects.length} />
        <MgsAdminStatCard detail="Currently visible on the public website." label="Published" value={published.length} />
        <MgsAdminStatCard detail="Pinned into the selected-work experience." label="Featured" value={featured.length} />
      </div>

      <details className="group rounded-2xl border border-white/10 bg-white/[0.035]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-[#fff7ee]">
          <span><span className="block text-base font-semibold">Add project</span><span className="mt-1 block text-sm font-normal text-[#b7aa9d]">Start a new bilingual case study.</span></span>
          <span aria-hidden="true" className="text-2xl transition-transform group-open:rotate-45">+</span>
        </summary>
        <div id="create-project" className="scroll-mt-6 border-t border-white/10 p-5"><MgsAdminProjectCreateForm disabled={!projectsData.status.connected} /></div>
      </details>
      <MgsAdminPanel
        description="Each card opens a full editor page."
        eyebrow="Library"
        title="Current entries"
      >
        <MgsAdminProjectList projects={projectsData.projects} />
      </MgsAdminPanel>
    </MgsAdminShell>
  );
}
