# Runbook: running the UAR automated test cases

This repo is a standalone Playwright suite for UAR (User Access Review).
It's meant to be run through Claude Code using the `uar-e2e-test-cases`
skill checked into this repo (`.claude/skills/uar-e2e-test-cases/SKILL.md`).
This runbook is the step-by-step for a person doing that.

## Prerequisites

- Node.js and npm installed.
- A local checkout of `andromedasec/voyager` (private repo) — needed for
  step 2, since voyager is the source of truth for this test code.
- Claude Code installed.
- The real Milkyway or testenv login OTP, delivered to the test account's
  email, at the time you run the tests (it's requested fresh each run — you
  can't prepare it ahead of time).

## Step 1 — clone this repo

```
git clone https://github.com/madhu760/uar-e2e.git
cd uar-e2e
```

## Step 2 — open it in Claude Code and invoke the skill

```
claude
```

Then ask Claude to run the UAR automated tests, or type:

```
/uar-e2e-test-cases
```

Claude loads the skill and walks through the remaining steps below itself —
you mainly need to answer two things when asked: the path to your local
`voyager` checkout, and the OTP code when it arrives by email.

## Step 3 — sync from voyager (the skill does this first)

Claude runs:

```
node scripts/sync-from-voyager.mjs <path-to-your-voyager-checkout>
```

This copies the latest `services/ui-app/packages/uar-e2e` files from your
voyager checkout into this repo — one-way, nothing is pushed back to
voyager. Claude then shows you `git diff` and asks before committing/pushing
the sync. If there's nothing new, it skips straight to running.

## Step 4 — one-time setup (first run only)

```
npm install
npx playwright install chromium
cp .env.template .env
```

You'll need to fill in `.env` with the required values (ask whoever set up
this repo if you don't have them — don't fabricate values).

## Step 5 — log in

Pick the environment you're testing:

**Milkyway:**
```
npm run milkyway:request-otp
```
Check the test account's email for the OTP, then:
```
npm run milkyway:verify-otp <code>
```

**Testenv:**
```
npm run testenv:request-otp
npm run testenv:verify-otp <code>
```

The session is cached under `.playwright/.auth/` — if it's still valid,
Claude will reuse it instead of asking for a new OTP.

## Step 6 — run the tests

Whole suite:
```
npm run e2e-test-milkyway
```
or
```
npm run e2e-test-testenv
```

A single file:
```
npm run e2e-test-testenv -- tests/uar/uarCampaignCreationTestCases.spec.ts
```

Watch it run (visible browser, slowed down):
```
npm run e2e-test-headed
```

## What's covered

See the "Existing test cases" table in
`.claude/skills/uar-e2e-test-cases/SKILL.md` for the current list of
`TC_UAR_*` cases and which file each one lives in.

## Troubleshooting

- **"Template never appeared in dropdown" / similar selection flake** — the
  template/campaign dropdowns are long and virtualized; an item not scrolled
  into view isn't in the DOM yet. The specs here type into the combobox to
  filter rather than scan the list — if you hit this on a new test, do the
  same rather than adding more retries.
- **A click/step hangs instead of failing** — neither Playwright config here
  sets `use.actionTimeout`, so an action without an explicit `{timeout}` can
  hang until the whole test's timeout fires. Check the spec has one.
- **Stale session** — delete `.playwright/.auth/<env>-session.json` and log
  in again if tests fail immediately on a page that needs auth.
- **Dropdown/menu not found** — Vuetify overlays (`.v-overlay--active
  .v-overlay__content`) render outside the dialog element in the DOM; query
  from `page`, not from the dialog locator.
