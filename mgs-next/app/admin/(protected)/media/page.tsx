import { MgsAdminMediaLibrary } from "@/components/mgs-admin-media-library";
import { MgsAdminShell } from "@/components/mgs-admin-shell";
import { getMgsAdminSetupStatus } from "@/lib/mgs-admin-auth";
import { listMgsAdminProjects } from "@/lib/mgs-content-store";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const setupStatus = getMgsAdminSetupStatus();
  const projectsData = await listMgsAdminProjects();

  return (
    <MgsAdminShell
      description="Upload, find and reuse images and documents across your projects."
      section="media"
      setupStatus={setupStatus}
      storageStatus={projectsData.status}
      title="Media library"
    >
      <MgsAdminMediaLibrary />
    </MgsAdminShell>
  );
}
