import { NextResponse } from "next/server";

import { getMgsAdminSetupStatus } from "@/lib/mgs-admin-auth";
import { getMgsSiteOrigin } from "@/lib/mgs-auth-config";
import { createMgsGoogleAuthorization, getMgsGoogleOAuthCookieOptions } from "@/lib/mgs-google-auth";

export const runtime = "nodejs";

function loginErrorResponse(requestUrl: string) {
  const loginUrl = new URL("/admin/login", getMgsSiteOrigin(requestUrl));
  loginUrl.searchParams.set("error", "google_not_configured");
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
  if (!getMgsAdminSetupStatus().googleAuthConfigured) {
    return loginErrorResponse(request.url);
  }

  try {
    const { authorizationUrl, cookieValue } = createMgsGoogleAuthorization(request.url);
    const response = NextResponse.redirect(authorizationUrl);
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set({ ...getMgsGoogleOAuthCookieOptions(), value: cookieValue });
    return response;
  } catch {
    return loginErrorResponse(request.url);
  }
}
