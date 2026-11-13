# UAR E2E Package

End-to-end Playwright tests for User Access Review (UAR) flows: campaign templates, campaign
lifecycle (create → start → activate), reviewer actions, sign-off, and revocation.

Separate from `@andromeda-ui/e2e-app-tests` so UAR's larger, longer-running suite can be run,
scheduled, and owned independently. Generic Page Object Models (`NDataGrid`, `SideNav`, `NSelect`,
`ProviderSelect`) are copied from that package rather than imported — both packages ship plain
`.ts` source with no build step, so a cross-package import can't resolve (Node's ESM resolver
looks for a compiled `.js` file that doesn't exist). Keep these in sync by hand if the source
POMs change meaningfully; UAR-specific POMs (e.g. `IdentityAccessManagementTabs`) live here only.

## Prerequisites

Same as `packages/e2e` — a Beatles-seeded environment, Okta SSO credentials, and a `.env` file
(copy `.env.template`) with `APP_USERNAME`, `APP_PASSWORD`, `APP_URL`.

## Steps to Run

From `services/ui-app/`:

```bash
pnpm install
pnpm exec playwright install
pnpm --filter @andromeda-ui/uar-e2e-tests run e2e-test
```

- `pnpm --filter @andromeda-ui/uar-e2e-tests run e2e-test-ui` — Playwright UI mode
- `pnpm --filter @andromeda-ui/uar-e2e-tests run e2e-test-headed` — headed browser

## Running against the milkyway tenant (manual OTP relay)

milkyway logs in via email + a 6-digit one-time code, not Okta email/password — it can't run
unattended like the Beatles flow above, so login is a separate manual two-step relay run once
per session before the actual test run. From `packages/uar-e2e/`:

1. Set `MILKYWAY_APP_URL` and `MILKYWAY_APP_USERNAME` in `.env` (see `.env.template`).
2. Request a code — sends a fresh 6-digit code to that inbox:
   ```bash
   pnpm run milkyway:request-otp
   ```
3. As soon as you have the code (codes expire fast), verify it:
   ```bash
   pnpm run milkyway:verify-otp -- <6-digit-code>
   ```
   On success this saves the session to `.playwright/.auth/milkyway-session.json`.
4. Run the suite — reuses the saved session, no login step:
   ```bash
   pnpm run e2e-test-milkyway
   ```

The session expires like any normal login session — repeat steps 2–3 when it does. Never commit
`.milkyway-auth-profile/` or `.playwright/.auth/milkyway-session.json` (both hold live session
cookies; already gitignored).

## Running against the test environment (manual OTP relay, video recording on)

Same email + one-time-code login as milkyway above, pointed at a separate "test" deployment
instead of staging. This config also runs headed (visible browser) and records a `.webm` video
of every test regardless of pass/fail — useful for demos. From `packages/uar-e2e/`:

1. Set `TESTENV_APP_URL` and `TESTENV_APP_USERNAME` in `.env` (see `.env.template`).
2. Request a code:
   ```bash
   pnpm run testenv:request-otp
   ```
3. As soon as you have the code, verify it:
   ```bash
   pnpm run testenv:verify-otp -- <6-digit-code>
   ```
   On success this saves the session to `.playwright/.auth/testenv-session.json`.
4. Run the suite:
   ```bash
   pnpm run e2e-test-testenv
   ```
   To run only the 9-test-case file: append `-- tests/uar/uarTemplateTestCases.spec.ts`.
5. Videos land under `.playwright/test-results-testenv/<test folder>/video.webm`, one per test.

Never commit `.testenv-auth-profile/` or `.playwright/.auth/testenv-session.json` (both hold live
session cookies; already gitignored).
