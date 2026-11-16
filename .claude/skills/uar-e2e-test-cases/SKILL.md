---
name: uar-e2e-test-cases
description: Run or extend the automated UAR (User Access Review) Playwright test cases in this repo. Use when asked to run UAR automated tests, add a new UAR test case (TC_UAR_*), or find which UAR flows already have coverage.
---

# UAR automated test cases

Standalone Playwright suite migrated from the `voyager` monorepo
(`services/ui-app/packages/uar-e2e`). All UAR specs live under `tests/uar/`.

## Existing test cases

| File | Test cases |
|---|---|
| `uarTemplateTestCases.spec.ts` | TC_UAR_TMPL_01 create template, TC_UAR_TMPL_02 scope provider loads Accounts options, TC_UAR_TMPL_04 mandatory field validation (Campaign Scope), TC_UAR_TMPL_05 multi-level Reviewer Selection Policy, TC_UAR_TMPL_09 Review Table Columns visibility/sort persists |
| `uarTemplateTestCasesTestenv.spec.ts` | Same TC_UAR_TMPL_01/02/04/05, run against testenv instead of Milkyway |
| `uarTemplates.spec.ts` | Create single-owner campaign template, Delete campaign template |
| `uarCampaignCreationTestCases.spec.ts` | TC_UAR_CMP_01 create campaign from existing template, TC_UAR_CMP_02 manually start a Draft campaign, TC_UAR_CMP_03 campaign auto-populates config from template, TC_UAR_CMP_04 campaign details navigation/tab rendering, TC_UAR_CMP_05 mandatory field validation |
| `ongoingCampaignFilterTestCases.spec.ts` | TC_UAR_FLT_01 single Campaign Owner filter, TC_UAR_FLT_02 remove active filter tag, TC_UAR_FLT_03 multiple Campaign Types filter, TC_UAR_FLT_04 global Clear resets filters, TC_UAR_FLT_05 filter by Revocation strategy, TC_UAR_FLT_06 no-records-found state, TC_UAR_FLT_07 create and track a 3-month ongoing campaign |

Shared helpers: `uarTemplates.utils.ts`, `uarTemplatesTestenv.utils.ts`,
`uarCampaigns.utils.ts`, `ongoingCampaignFilters.utils.ts`. POMs in `pom/`
(`NSelect`, `NDataGrid`, `ProviderSelect`, `SideNav`, `IdentityAccessManagementTabs`).

Not yet covered: filter/export/report test cases on a **Completed** campaign
— no completed campaign exists in Milkyway by default, and building one end
to end (template → campaign → activate → approve every review set → sign
off) is a separate, longer flow not yet included in this repo.

## Setup

```
npm install
npx playwright install chromium
cp .env.template .env   # fill in required values
```

## Running

Two environments, each with its own config and OTP login:

- **Milkyway** (`playwright.milkyway.config.ts`):
  ```
  npm run milkyway:request-otp
  npm run milkyway:verify-otp <code>
  npm run e2e-test-milkyway
  ```
- **Testenv** (`playwright.testenv.config.ts`):
  ```
  npm run testenv:request-otp
  npm run testenv:verify-otp <code>
  npm run e2e-test-testenv
  ```

**Always ask the user for the real OTP code when a fresh login is needed —
never guess or fabricate it.** Sessions are cached under `.playwright/.auth/`;
reuse if still valid before requesting a new OTP.

Run a single file: append its path, e.g.
`npm run e2e-test-testenv -- tests/uar/uarCampaignCreationTestCases.spec.ts`.

Other useful scripts: `e2e-test-headed` (visible browser, slowed down),
`e2e-test-ui` (Playwright UI mode) — both run against the default
(non-Milkyway/testenv) `playwright.config.ts`.

## Adding a new test case

- Name it `TC_UAR_<AREA>_<NN>: <what it verifies>` to match the existing
  convention (`TMPL`, `CMP`, `FLT`).
- Put shared setup/teardown logic in that area's `.utils.ts`, not inline in
  the spec, matching the existing split.
- No `use.actionTimeout` is configured in either env config — any
  click/locator call without an explicit `{timeout: ...}` can hang until the
  whole test's timeout fires. Always pass an explicit timeout.
- Dialogs often have unlabeled fields — select positionally
  (`dialog.getByRole('textbox').nth(n)`) rather than assuming an accessible
  name exists; confirm via a failed-run's `error-context.md` snapshot first.
- Dropdown/select menus render in `.v-overlay--active .v-overlay__content`,
  not inside the dialog element — query from `page`, not from the dialog
  locator, and prefer `.last()` only when you've confirmed there's exactly
  one active overlay at that point.
- A template/campaign select backed by a long list can be virtualized — an
  item not scrolled into view won't be in the DOM for `isVisible()` to find.
  Type into the combobox to filter instead of scanning/scrolling the list.
