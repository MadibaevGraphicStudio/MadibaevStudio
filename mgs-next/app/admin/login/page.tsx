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
                className="relative inline-flex min-h-12 w-full items-center justify-center rounded-[4px] border border-[#747775] bg-white px-12 text-[14px] font-medium leading-5 !text-[#1f1f1f] shadow-sm transition-[background-color,border-color,box-shadow] hover:border-[#5f6368] hover:bg-[#f8faff] hover:shadow-[0_1px_2px_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285f4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111]"
                href="/api/auth/google"
              >
                <svg
                  aria-hidden="true"
                  className="absolute left-3 size-5"
                  viewBox="0 0 18 18"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.909c1.702-1.567 2.684-3.874 2.684-6.615Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.91-2.258c-.805.54-1.835.859-3.046.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.963 10.707A5.42 5.42 0 0 1 3.682 9c0-.592.102-1.167.281-1.707V4.961H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.039l3.007-2.332Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.579c1.322 0 2.508.454 3.441 1.346l2.581-2.581C13.463.892 11.426 0 9 0A9 9 0 0 0 .956 4.961l3.007 2.332C4.672 5.164 6.656 3.579 9 3.579Z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
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

