import { MgsAdminEnquiryList } from "@/components/mgs-admin-enquiry-list";
import { MgsAdminPanel, MgsAdminShell, MgsAdminStatCard } from "@/components/mgs-admin-shell";
import { getMgsAdminSetupStatus } from "@/lib/mgs-admin-auth";
import { listMgsEnquiries } from "@/lib/mgs-content-store";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  const setupStatus = getMgsAdminSetupStatus();
  const enquiriesData = await listMgsEnquiries();

  return (
    <MgsAdminShell
      description="Follow new briefs from first contact to accepted projects."
      section="enquiries"
      setupStatus={setupStatus}
      storageStatus={enquiriesData.status}
      title="Enquiries"
    >
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <MgsAdminStatCard detail="All website enquiries received so far." label="Total" value={enquiriesData.enquiries.length} />
        <MgsAdminStatCard detail="Waiting for first response." label="New" value={enquiriesData.enquiries.filter((item) => item.status === "new").length} />
        <MgsAdminStatCard detail="Already contacted." label="Contacted" value={enquiriesData.enquiries.filter((item) => item.status === "contacted").length} />
        <MgsAdminStatCard detail="Active pipeline conversations." label="In discussion" value={enquiriesData.enquiries.filter((item) => item.status === "in_discussion").length} />
        <MgsAdminStatCard detail="Accepted opportunities." label="Accepted" value={enquiriesData.enquiries.filter((item) => item.status === "accepted").length} />
      </div>

      <MgsAdminPanel
        description="Search conversations, review briefs and keep each client’s progress up to date."
        eyebrow="Pipeline"
        title="Lead management"
      >
        <MgsAdminEnquiryList disabled={!enquiriesData.status.connected} enquiries={enquiriesData.enquiries} />
      </MgsAdminPanel>
    </MgsAdminShell>
  );
}
