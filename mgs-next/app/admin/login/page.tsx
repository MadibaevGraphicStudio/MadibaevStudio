import { redirect } from "next/navigation";

import { MgsAdminLoginForm } from "@/components/mgs-admin-login-form";
import { getMgsAdminAccessState } from "@/lib/mgs-admin-auth";

export const dynamic = "force-dynamic";

const loginErrors: Record<string, string> = {
  access_denied: "Access is allowed only for approved Google accounts.",
  google_not_configured: "Google sign-in is not configured on the server yet.",
  invalid_oauth_response: "Google sign-in expired or could not be verified. Please try again.",
  oauth_failed: "Google sign-in could not be completed. Please try again.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const access = await getMgsAdminAccessState();
  const errorMessage = params.error ? loginErrors[params.error] : null;

  if (access.authenticated) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 py-10 text-[#f6ecdd]">
      <div className="w-full max-w-[560px] rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,#171717_0%,#0b0b0b_70%,#050505_100%)] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.4)]">
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#c6b798]">Madibaev Graphic Studio / Admin</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#fff7ee]">Owner access</h1>
        <p className="mt-4 text-sm leading-7 text-[#b7aa9d]">
          Sign in with an approved Google account. Sessions are stored as an HttpOnly cookie and expire after 12 hours.
        </p>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
          {!access.setup.authConfigured ? (
            <div className="mb-5 rounded-[24px] border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
              Google sign-in needs these environment variables: {access.setup.missingAuthEnv.join(", ")}.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-5 rounded-[24px] border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
              {errorMessage}
            </div>
          ) : null}

          {!access.setup.storageConnected ? (
            <div className="mb-5 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-[#b7aa9d]">
              `BLOB_READ_WRITE_TOKEN` is not connected yet. You can still review the admin UI, but saves and enquiries stay disabled until Blob is added in Vercel.
            </div>
          ) : null}

          {access.setup.googleAuthConfigured ? (
            <a
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-[#171717] shadow-[0_18px_40px_rgba(0,0,0,0.24)] transition hover:bg-[#f3f3f3]"
              href="/api/auth/google"
            >
              <span aria-hidden="true" className="grid size-6 place-items-center rounded-full border border-black/10 font-bold text-[#4285f4]">G</span>
              Continue with Google
            </a>
          ) : null}

          {access.setup.passwordAuthConfigured ? (
            <>
              {access.setup.googleAuthConfigured ? (
                <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#80756c]">
                  <span className="h-px flex-1 bg-white/10" />
                  Password fallback
                  <span className="h-px flex-1 bg-white/10" />
                </div>
              ) : null}
              <MgsAdminLoginForm disabled={!access.setup.passwordAuthConfigured} />
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
