// The test env (same milkyway tenant, different deployment) authenticates via
// email + one-time code, same as staging — so it can't run unattended in CI
// either. This profile dir persists cookies across the two separate script
// invocations (request, then verify) that a human OTP relay requires.
export const persistentProfileDir = '.testenv-auth-profile';

export const testenvSessionStorageFilePath =
  '.playwright/.auth/testenv-session.json';

export function getTestenvEnv() {
  const appUrl = process.env.TESTENV_APP_URL;
  const username = process.env.TESTENV_APP_USERNAME;

  if (!appUrl || !username) {
    throw new Error(
      'Missing required environment variables: TESTENV_APP_URL and TESTENV_APP_USERNAME must be set (see .env.template)',
    );
  }

  return { appUrl, username };
}
