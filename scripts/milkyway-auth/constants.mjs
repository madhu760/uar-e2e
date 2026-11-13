// The milkyway tenant authenticates via email + one-time code, not the Okta
// email/password flow tests/auth.setup.ts implements for the Beatles env — so it
// can't run unattended in CI. This profile dir persists cookies across the two
// separate script invocations (request, then verify) that a human OTP relay
// requires.
export const persistentProfileDir = '.milkyway-auth-profile';

export const milkywaySessionStorageFilePath =
  '.playwright/.auth/milkyway-session.json';

export function getMilkywayEnv() {
  const appUrl = process.env.MILKYWAY_APP_URL;
  const username = process.env.MILKYWAY_APP_USERNAME;

  if (!appUrl || !username) {
    throw new Error(
      'Missing required environment variables: MILKYWAY_APP_URL and MILKYWAY_APP_USERNAME must be set (see .env.template)',
    );
  }

  return { appUrl, username };
}
