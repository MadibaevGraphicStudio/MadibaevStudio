import { type NextRequest, NextResponse } from "next/server";

import { createMgsAdminSessionCookie, getMgsAdminCookieOptions } from "@/lib/mgs-admin-auth";
import { getMgsSiteOrigin } from "@/lib/mgs-auth-config";
import {
  authenticateMgsGoogleCallback,
  getMgsGoogleOAuthCookieOptions,
  MGS_GOOGLE_OAUTH_COOKIE_NAME,
  MgsGoogleAuthError,
  type MgsGoogleAuthErrorCode,
} from "@/lib/mgs-google-auth";

export const runtime = "nodejs";

function clearOAuthCookie(response: NextResponse) {
  response.cookies.set({
    ...getMgsGoogleOAuthCookieOptions(),
    value: "",
    expires: new Date(0),
    maxAge: 0,
  });
}

function loginErrorResponse(requestUrl: string, error: MgsGoogleAuthErrorCode) {
  const loginUrl = new URL("/admin/login", getMgsSiteOrigin(requestUrl));
  loginUrl.searchParams.set("error", error);
  const response = NextResponse.redirect(loginUrl);
  clearOAuthCookie(response);
  return response;
}

export async function GET(request: NextRequest) {
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    return loginErrorResponse(request.url, providerError === "access_denied" ? "access_denied" : "oauth_failed");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieValue = request.cookies.get(MGS_GOOGLE_OAUTH_COOKIE_NAME)?.value;

  if (!code || !state || !cookieValue) {
    return loginErrorResponse(request.url, "invalid_oauth_response");
  }

  try {
    await authenticateMgsGoogleCallback({ code, cookieValue, requestUrl: request.url, state });
    const session = createMgsAdminSessionCookie();
    const response = NextResponse.redirect(new URL("/admin", getMgsSiteOrigin(request.url)));
    response.cookies.set({ ...getMgsAdminCookieOptions(session.expiresAt), value: session.token });
    clearOAuthCookie(response);
    return response;
  } catch (error) {
    const code = error instanceof MgsGoogleAuthError ? error.code : "oauth_failed";
    return loginErrorResponse(request.url, code);
  }
}
