export type MgsAdminAuthEnvKey =
  | "ADMIN_GOOGLE_EMAILS"
  | "ADMIN_PASSWORD"
  | "ADMIN_SESSION_SECRET"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET";

export type MgsAdminSetupStatus = {
  authConfigured: boolean;
  googleAuthConfigured: boolean;
  passwordAuthConfigured: boolean;
  storageConnected: boolean;
  missingAuthEnv: readonly MgsAdminAuthEnvKey[];
};

export function readMgsAuthEnv(name: MgsAdminAuthEnvKey) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getMgsAllowedGoogleEmails() {
  return (readMgsAuthEnv("ADMIN_GOOGLE_EMAILS") ?? "")
    .split(/[\s,]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function hasPersistentStorage() {
  return Boolean(process.env.MGS_DATA_DIR?.trim() || process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function shouldUseMgsSecureCookie() {
  const explicit = process.env.MGS_COOKIE_SECURE?.trim().toLowerCase();

  if (explicit === "true" || explicit === "1") return true;
  if (explicit === "false" || explicit === "0") return false;

  return (
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") === true
  );
}

export function getMgsSiteOrigin(requestUrl?: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallbackUrl = requestUrl?.trim();
  const value = configuredUrl || fallbackUrl;

  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL.");
  }

  return new URL(value).origin;
}

export function getMgsGoogleAuthConfig(requestUrl?: string) {
  const clientId = readMgsAuthEnv("GOOGLE_CLIENT_ID");
  const clientSecret = readMgsAuthEnv("GOOGLE_CLIENT_SECRET");
  const allowedEmails = getMgsAllowedGoogleEmails();

  if (!clientId || !clientSecret || allowedEmails.length === 0) {
    throw new Error("Google admin authentication is not configured.");
  }

  const siteOrigin = getMgsSiteOrigin(requestUrl);

  return {
    allowedEmails,
    clientId,
    clientSecret,
    redirectUri: `${siteOrigin}/api/auth/callback/google`,
    siteOrigin,
  };
}

export function getMgsAdminSetupStatus(): MgsAdminSetupStatus {
  const sessionSecretConfigured = Boolean(readMgsAuthEnv("ADMIN_SESSION_SECRET"));
  const passwordAuthConfigured = sessionSecretConfigured && Boolean(readMgsAuthEnv("ADMIN_PASSWORD"));
  const missingGoogleEnv = (["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "ADMIN_GOOGLE_EMAILS"] as const)
    .filter((key) => key === "ADMIN_GOOGLE_EMAILS" ? getMgsAllowedGoogleEmails().length === 0 : !readMgsAuthEnv(key));
  const googleAuthConfigured = sessionSecretConfigured && missingGoogleEnv.length === 0;
  const missingAuthEnv: MgsAdminAuthEnvKey[] = [];

  if (!sessionSecretConfigured) missingAuthEnv.push("ADMIN_SESSION_SECRET");
  if (!googleAuthConfigured) missingAuthEnv.push(...missingGoogleEnv);

  return {
    authConfigured: googleAuthConfigured || passwordAuthConfigured,
    googleAuthConfigured,
    passwordAuthConfigured,
    storageConnected: hasPersistentStorage(),
    missingAuthEnv,
  };
}
