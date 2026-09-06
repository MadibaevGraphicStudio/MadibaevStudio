import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import {
  getMgsAdminSetupStatus,
  readMgsAuthEnv,
  shouldUseMgsSecureCookie,
  type MgsAdminSetupStatus,
} from "@/lib/mgs-auth-config";

export type { MgsAdminSetupStatus } from "@/lib/mgs-auth-config";

export const MGS_ADMIN_COOKIE_NAME = "mgs_admin_session";
export const MGS_ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

type MgsAdminSessionPayload = {
  exp: number;
  iat: number;
  nonce: string;
};

export type MgsAdminSession = {
  expiresAt: string;
  issuedAt: string;
};

export type MgsAdminAccessState =
  | {
      authenticated: false;
      session: null;
      setup: MgsAdminSetupStatus;
    }
  | {
      authenticated: true;
      session: MgsAdminSession;
      setup: MgsAdminSetupStatus;
    };

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function parseSessionToken(token: string, secret: string): MgsAdminSessionPayload | null {
  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload, secret);

  if (!safeCompare(providedSignature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as Partial<MgsAdminSessionPayload>;

    if (
      typeof payload.exp !== "number" ||
      typeof payload.iat !== "number" ||
      typeof payload.nonce !== "string" ||
      payload.exp <= Date.now()
    ) {
      return null;
    }

    return {
      exp: payload.exp,
      iat: payload.iat,
      nonce: payload.nonce,
    };
  } catch {
    return null;
  }
}

function createSessionToken(secret: string) {
  const issuedAt = Date.now();
  const payload: MgsAdminSessionPayload = {
    exp: issuedAt + MGS_ADMIN_SESSION_MAX_AGE * 1000,
    iat: issuedAt,
    nonce: randomUUID(),
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));

  return {
    token: `${encodedPayload}.${signPayload(encodedPayload, secret)}`,
    payload,
  };
}

export { getMgsAdminSetupStatus } from "@/lib/mgs-auth-config";

export async function getMgsAdminAccessState(): Promise<MgsAdminAccessState> {
  const setup = getMgsAdminSetupStatus();

  if (!setup.authConfigured) {
    return {
      authenticated: false,
      session: null,
      setup,
    };
  }

  const secret = readMgsAuthEnv("ADMIN_SESSION_SECRET");
  const cookieStore = await cookies();
  const token = cookieStore.get(MGS_ADMIN_COOKIE_NAME)?.value;

  if (!secret || !token) {
    return {
      authenticated: false,
      session: null,
      setup,
    };
  }

  const payload = parseSessionToken(token, secret);

  if (!payload) {
    return {
      authenticated: false,
      session: null,
      setup,
    };
  }

  return {
    authenticated: true,
    session: {
      expiresAt: new Date(payload.exp).toISOString(),
      issuedAt: new Date(payload.iat).toISOString(),
    },
    setup,
  };
}

export function authenticateMgsAdminPassword(password: string) {
  const expectedPassword = readMgsAuthEnv("ADMIN_PASSWORD");

  if (!expectedPassword) {
    return false;
  }

  return safeCompare(password, expectedPassword);
}

export function createMgsAdminSessionCookie() {
  const secret = readMgsAuthEnv("ADMIN_SESSION_SECRET");

  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET.");
  }

  const { token, payload } = createSessionToken(secret);

  return {
    token,
    expiresAt: payload.exp,
  };
}

export function getMgsAdminCookieOptions(expiresAt: number) {
  return {
    name: MGS_ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseMgsSecureCookie(),
    path: "/",
    expires: new Date(expiresAt),
    maxAge: MGS_ADMIN_SESSION_MAX_AGE,
  };
}
