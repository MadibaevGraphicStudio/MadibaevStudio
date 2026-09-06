import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { createRemoteJWKSet, jwtVerify } from "jose";

import {
  getMgsGoogleAuthConfig,
  readMgsAuthEnv,
  shouldUseMgsSecureCookie,
} from "@/lib/mgs-auth-config";

export const MGS_GOOGLE_OAUTH_COOKIE_NAME = "mgs_google_oauth";

const GOOGLE_OAUTH_MAX_AGE = 10 * 60;
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

type MgsGoogleOAuthPayload = {
  exp: number;
  nonce: string;
  state: string;
  verifier: string;
};

export type MgsGoogleAuthErrorCode =
  | "access_denied"
  | "google_not_configured"
  | "invalid_oauth_response"
  | "oauth_failed";

export class MgsGoogleAuthError extends Error {
  constructor(public readonly code: MgsGoogleAuthErrorCode) {
    super(code);
    this.name = "MgsGoogleAuthError";
  }
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signOAuthPayload(encodedPayload: string) {
  const secret = readMgsAuthEnv("ADMIN_SESSION_SECRET");
  if (!secret) throw new MgsGoogleAuthError("google_not_configured");
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function encodeOAuthPayload(payload: MgsGoogleOAuthPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${signOAuthPayload(encodedPayload)}`;
}

function decodeOAuthPayload(value: string) {
  const parts = value.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const [encodedPayload, providedSignature] = parts;
  const expectedSignature = signOAuthPayload(encodedPayload);
  if (!safeCompare(providedSignature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<MgsGoogleOAuthPayload>;
    if (
      typeof payload.exp !== "number" ||
      typeof payload.nonce !== "string" ||
      typeof payload.state !== "string" ||
      typeof payload.verifier !== "string" ||
      payload.exp <= Date.now()
    ) {
      return null;
    }

    return payload as MgsGoogleOAuthPayload;
  } catch {
    return null;
  }
}

export function getMgsGoogleOAuthCookieOptions() {
  return {
    name: MGS_GOOGLE_OAUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseMgsSecureCookie(),
    path: "/api/auth/callback/google",
    maxAge: GOOGLE_OAUTH_MAX_AGE,
  };
}

export function createMgsGoogleAuthorization(requestUrl: string) {
  let config;
  try {
    config = getMgsGoogleAuthConfig(requestUrl);
  } catch {
    throw new MgsGoogleAuthError("google_not_configured");
  }

  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const verifier = randomBytes(64).toString("base64url");
  const codeChallenge = createHash("sha256").update(verifier).digest("base64url");
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("nonce", nonce);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("prompt", "select_account");

  return {
    authorizationUrl,
    cookieValue: encodeOAuthPayload({
      exp: Date.now() + GOOGLE_OAUTH_MAX_AGE * 1000,
      nonce,
      state,
      verifier,
    }),
  };
}

export async function authenticateMgsGoogleCallback({
  code,
  cookieValue,
  requestUrl,
  state,
}: {
  code: string;
  cookieValue: string;
  requestUrl: string;
  state: string;
}) {
  let config;
  try {
    config = getMgsGoogleAuthConfig(requestUrl);
  } catch {
    throw new MgsGoogleAuthError("google_not_configured");
  }

  const oauthPayload = decodeOAuthPayload(cookieValue);
  if (!oauthPayload || !safeCompare(state, oauthPayload.state)) {
    throw new MgsGoogleAuthError("invalid_oauth_response");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      code_verifier: oauthPayload.verifier,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);

  if (!tokenResponse?.ok) {
    throw new MgsGoogleAuthError("oauth_failed");
  }

  const tokenData = await tokenResponse.json().catch(() => null) as { id_token?: unknown } | null;
  if (typeof tokenData?.id_token !== "string") {
    throw new MgsGoogleAuthError("oauth_failed");
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(tokenData.id_token, GOOGLE_JWKS, {
      audience: config.clientId,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
    }));
  } catch {
    throw new MgsGoogleAuthError("oauth_failed");
  }

  if (payload.nonce !== oauthPayload.nonce || payload.email_verified !== true || typeof payload.email !== "string") {
    throw new MgsGoogleAuthError("invalid_oauth_response");
  }

  const email = payload.email.trim().toLowerCase();
  if (!config.allowedEmails.includes(email)) {
    throw new MgsGoogleAuthError("access_denied");
  }

  return { email };
}
