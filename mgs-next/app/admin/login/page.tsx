import { redirect } from "next/navigation";
import "@/app/admin/admin-ui.css";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FolderOpen, Inbox, LockKeyhole, Images } from "lucide-react";

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
    <main className="admin-ui min-h-screen bg-[#080808] text-[#f6ecdd]">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-6 sm:px-10">
        <Link aria-label="Madibaev Graphic Studio home" href="/"><Image alt="Madibaev Graphic Studio" height={36} priority src="/mgs-logo.svg" width={108} /></Link>
        <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs text-[#b7aa9d] transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[#c6b798]" href="/"><ArrowLeft aria-hidden="true" className="size-4" /> Back to website</Link>
      </header>
      <div className="mx-auto grid min-h-[calc(100dvh-100px)] max-w-[1200px] items-center gap-12 px-5 pb-16 pt-8 sm:px-10 lg:grid-cols-[1fr_480px] lg:gap-20">
      <aside className="hidden lg:block">
        <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-[#c6b798]"><span className="h-px w-8 bg-[#c6b798]" /> Studio workspace</p>
        <h2 className="max-w-lg text-6xl font-medium leading-[1.08] tracking-[-0.065em] text-[#fff7ee]">Behind every<br />great project.</h2>
        <p className="mt-6 max-w-md text-base leading-7 text-[#a99c90]">A focused space to curate your work, organise media and turn new conversations into projects.</p>
        <div className="mt-12 grid max-w-md gap-4 border-t border-white/10 pt-7">
          {[[FolderOpen, "Portfolio", "Keep your best work in the spotlight."], [Images, "Media library", "Your project assets, in one place."], [Inbox, "Enquiries", "Every new brief, ready for your reply."]].map(([Icon, title, detail]) => {
            const FeatureIcon = Icon as typeof FolderOpen;
            return <div className="flex items-center gap-4" key={String(title)}><span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]"><FeatureIcon aria-hidden="true" className="size-4 text-[#c6b798]" /></span><div><p className="text-sm font-medium text-[#efe1cf]">{String(title)}</p><p className="mt-1 text-xs text-[#a99c90]">{String(detail)}</p></div></div>;
          })}
        </div>
      </aside>
      <section className="mx-auto w-full max-w-[480px] rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-9">
        <span className="mb-7 inline-flex size-12 items-center justify-center rounded-2xl border border-[#c6b798]/20 bg-[#c6b798]/10 text-[#c6b798]"><LockKeyhole aria-hidden="true" className="size-5" /></span>
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-[#c6b798]">Madibaev / Admin</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[#fff7ee]">Welcome back.</h1>
        <p className="mt-3 text-sm leading-6 text-[#b7aa9d]">
          Sign in to manage your studio’s portfolio, media and enquiries.
        </p>

        <div className="mt-7">
          {!access.setup.authConfigured ? (
            <div className="mb-5 rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100" role="status">
              Sign-in is not configured yet. Contact the site administrator.
              <details className="mt-2 text-xs"><summary className="cursor-pointer">Setup details</summary><p className="mt-2 break-words">Missing environment variables: {access.setup.missingAuthEnv.join(", ")}.</p></details>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-5 rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100" role="alert">
              {errorMessage}
            </div>
          ) : null}

          {!access.setup.storageConnected ? (
            <div className="mb-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-[#b7aa9d]">
              Storage is unavailable. You can sign in, but changes cannot be saved until storage is connected.
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
                  or use your password
                  <span className="h-px flex-1 bg-white/10" />
                </div>
              ) : null}
              <MgsAdminLoginForm disabled={!access.setup.passwordAuthConfigured} />
            </>
          ) : null}
        </div>
        <p className="mt-7 flex items-start gap-2 border-t border-white/10 pt-5 text-xs leading-5 text-[#a99c90]"><LockKeyhole aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" /> Private workspace. Your session expires after 12 hours.</p>
        <Link className="mt-5 inline-flex items-center gap-1.5 text-xs text-[#c6b798] hover:text-white" href="/contact">Need help signing in? <ArrowUpRight aria-hidden="true" className="size-3.5" /></Link>
      </section>
      </div>
    </main>
  );
}

