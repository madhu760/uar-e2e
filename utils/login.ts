import type { Locator, Page } from '@playwright/test';

/**
 * Waits for a login error banner to appear and throws an error if it does.
 */
function getFailOnLoginErrorBannerPromise(
  locator: Locator,
  step: 'email' | 'password',
): Promise<void> {
  return (
    locator
      // no need to wait for it for the default 30s and delay the rest of the setup/tests
      // need to use waitFor because isHidden will happily return true while API call is in flight
      .waitFor({ timeout: 15000 })
      .then(async () => {
        const alertMessage = await locator.innerText();

        throw new Error(
          `Okta login failed on ${step} step with the message: ${alertMessage}`,
        );
      })
  );
}

/**
 * Performs login via the app's email form and Okta SSO
 */
export async function performLogin(page: Page): Promise<void> {
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'Missing required environment variables: APP_USERNAME and APP_PASSWORD must be set',
    );
  }

  // App login form
  const emailField = page.locator('input[type=email]');
  await emailField.fill(username);

  const signInBtn = page.getByRole('button', {
    name: 'Sign in with email',
  });
  await signInBtn.click();

  // Okta SSO
  await page.waitForURL(/.*okta.com.*/);

  const loginErrorBanner = page
    .getByRole('alert')
    .and(page.locator('.okta-form-infobox-error'));

  // Username screen
  await page.getByLabel('Username').fill(username);

  const nextBtn = page.getByRole('button', { name: 'Next' });
  await nextBtn.click();

  const verifyButton = page.getByRole('button', { name: 'Verify' });
  const verifyButtonPromise = verifyButton.waitFor({ timeout: 5000 });

  // either button changes its name and password field appears
  // or there is a login error to catch and report
  await Promise.race([
    verifyButtonPromise,
    getFailOnLoginErrorBannerPromise(loginErrorBanner, 'email'),
  ]);

  // Password screen
  await page.getByLabel('Password').fill(password);
  await verifyButton.click();

  // Wait for navigation away from Okta or catch password error
  const navigationAwayFromOkta = page.waitForURL(
    (url) => !url.href.includes('okta.com'),
  );

  await Promise.race([
    navigationAwayFromOkta,
    getFailOnLoginErrorBannerPromise(loginErrorBanner, 'password'),
  ]);
}
