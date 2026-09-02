# Task: Make the header notification bell functional (admin)

## Problem
`src/components/layout/shared-header.tsx` rendered a `<Bell>` inside a `Button`
with no `onClick` and a hard-coded dot that was always visible. It was purely
decorative on all 38 admin pages.

## Approach
Notifications are **derived live** from data that already exists in Firestore
for the active branch — no new collection, no new security rules, nothing to
backfill, and nothing can go stale. Read-state is per-user in `localStorage`
(derived alerts have no server-side doc to flag).

## Plan
- [x] `src/hooks/use-notifications.tsx` — derives alerts from real-time data:
      - overdue / due-today lead follow-ups (`enquiries.followUpDate`)
      - overdue fee dues (`fees.balance > 0 && dueDate < today`)
      - new enquiries created today (`enquiries.status === "New"`)
      Each alert gets a stable id so read-state survives refresh.
- [x] Persist read ids in `localStorage` keyed by user uid; prune ids for
      alerts that no longer exist so the key cannot grow forever.
- [x] `src/components/layout/notifications-popover.tsx` — bell + unread count
      badge, grouped scrollable list, per-item click → navigate + mark read,
      "Mark all as read", empty state.
- [x] Wire into `shared-header.tsx`, replacing the static bell.
- [x] Release the Radix UI lock on navigation (see tasks/lessons.md).
- [x] Verify with `npm run typecheck` scoped to the touched files.

## Follow-up fix: `localeCompare is not a function`
First run crashed on real data. `dueDate` / `followUpDate` are declared `string`
in every page's doc interface, but older records store **Firestore Timestamps**.

- [x] Added `toDateKey()` — normalises string / Timestamp / Date / ISO / empty
      to a local `YYYY-MM-DD` key (or `null`), used for *all* comparisons.
- [x] Added `toNumber()` — `balance` is sometimes stored as a string.
- [x] Retyped `followUpDate` / `dueDate` as `unknown` so the compiler stops
      vouching for a guarantee Firestore does not make.
- [x] Recorded the pattern in `tasks/lessons.md`.

## Review

**Files changed**
- `src/hooks/use-notifications.tsx` (new) — derivation + read-state
- `src/components/layout/notifications-popover.tsx` (new) — UI
- `src/components/layout/shared-header.tsx` — swapped the dead bell for the popover
- `tasks/lessons.md` — Firestore date-field lesson

**Behaviour now**
- Bell shows a red unread count (`9+` past nine); no badge when caught up.
- Popover lists alerts unread-first, then by severity (urgent → warning → info),
  then most-overdue first. Colour-coded left border and icon per source.
- Clicking an item marks it read and navigates to the lead / fee balance page.
- "Mark all read" and "View all reminders" in the footer.
- Capped at 25 per source so a large branch cannot lock up the popover.

**Verification**
- `npx tsc --noEmit` — no errors in any touched file.
- Extracted the pure date/number helpers verbatim from the hook, transpiled them
  and ran 12 assertions covering every shape that appears in the data
  (string, Timestamp, Date, ISO, empty, whitespace, null, undefined, garbage)
  plus the exact `map → filter → sort` pipeline that crashed. All passed.
- `GET /admin/dashboard` → HTTP 200 on the running dev server, no compile
  errors and no Next.js error overlay in the response.

**Not done / notes**
- Read-state is per browser, not synced across devices. A derived alert has no
  document to flag, so syncing would mean a real `notifications` collection plus
  a writer and security rules — a much larger change than this task called for.
- Only the three sources above feed the bell. Attendance and exam alerts would
  slot in as extra blocks in the same `derived` memo if wanted later.

---

# Task: Make the header search bar functional

## Problem
The header rendered a bare `<input placeholder="Search...">` with no state, no
handler and no results — decorative, and hidden entirely on mobile.

## Approach
A ⌘K command palette over the data already subscribed elsewhere in the app,
searching **students, staff, enquiries and every admin page** at once.

The page list is the interesting part: rather than hand-copying 100+ routes into
the search (guaranteed to drift), the sidebar's `navSections` tree was extracted
into `src/components/layout/admin-nav.ts`. Sidebar and search now render from
the same list and apply the same `hasAccess` role gating, so a route can never
appear in one and not the other.

## Plan
- [x] Extract `navSections` + types + `hasAccess` → `admin-nav.ts`; sidebar imports them.
- [x] Trim the icon imports the sidebar no longer uses.
- [x] `src/components/layout/global-search.tsx` — CommandDialog palette.
- [x] Search students (name / app no / class / parent / phone), staff
      (name / staff id / role / phone), enquiries (name / enquiry no / class /
      phone / status) and pages (label / section / href).
- [x] ⌘K / Ctrl+K shortcut; "Jump to" shortlist when the query is empty.
- [x] Replace the dead input; add a mobile icon trigger so search is reachable there.
- [x] Release the Radix UI lock before navigating (CommandDialog is modal).

## Review

**Files changed**
- `src/components/layout/admin-nav.ts` (new) — nav tree, now shared
- `src/components/layout/global-search.tsx` (new) — the palette
- `src/components/layout/admin-sidebar.tsx` — imports the nav instead of owning it (534 → 245 lines)
- `src/components/layout/shared-header.tsx` — dead input → `<GlobalSearch />`

**Decisions worth noting**
- Collections are only subscribed *after* the palette is first opened. The header
  is on all 38 admin pages; subscribing three whole collections on every page
  load to power a box nobody had clicked would have been a real regression.
- Results are capped at 6 per group, and each row carries a unique cmdk `value`
  so two students with identical details stay separately selectable.
- Pages are deduped by href — `/admin/examination/marksheet` is linked from both
  Academics and Examination, which would otherwise show twice and collide on key.

**Verification**
- `npx tsc --noEmit` — no errors in any touched file.
- Extraction integrity: all 102 routes present in `admin-nav.ts`, 0 left behind
  in the sidebar, no orphaned fragments, and the line accounting balances exactly
  (534 − 284 moved + 1 import − 5 trimmed icon lines = 245).
- Extracted the search helpers verbatim, transpiled and ran 19 assertions:
  field-shape handling (numeric appNo, Timestamp, null, array), matching by name
  / app no / phone / parent name / class, the 6-row cap, no false positives, and
  cmdk value uniqueness for identical records. All passed.
- `/admin/dashboard`, `/admin/students`, `/admin/leads` → HTTP 200 on the running
  dev server, including after forcing a recompile of the refactored modules.

**Not done / notes**
- Matching is substring, not fuzzy — "ravi kumar" finds the student, "kumar ravi"
  does not. Fine for ids and names; worth revisiting if users ask.
- The search covers students, staff, enquiries and pages. Fees, expenses and
  library records are not indexed; each would be another collection subscription,
  so they were left out until there's a reason to add them.

## Follow-up fix: `DialogContent requires a DialogTitle`

Opening the palette logged a Radix accessibility warning. `CommandDialog` in
`src/components/ui/command.tsx` rendered a `DialogContent` with no `DialogTitle`
at all — a pre-existing gap in the shared component that nothing had hit before,
because the palette was its first consumer.

- [x] Fixed in `CommandDialog` itself, not at the call site, so any future
      consumer is covered: it now renders a `sr-only` `DialogTitle` plus a
      `DialogDescription` (the latter silences the matching `aria-describedby`
      warning), with `title` / `description` props to override them.
- [x] Used Tailwind's `sr-only` rather than Radix's `VisuallyHidden` —
      `@radix-ui/react-visually-hidden` is only present transitively, and
      `sr-only` is already used in `dialog.tsx`.
- [x] `GlobalSearch` passes a meaningful "Search" title / description.
- [x] Added `pr-10` to the palette's input: `DialogContent` renders an absolute
      close button at top-right that otherwise sat over the typed text.

Verified: `tsc` clean, and `/admin/dashboard` + `/admin/students` return HTTP 200
after forcing a recompile of both changed modules.

## Follow-up fix: palette rows looked disabled

Every row in the palette (the "Jump to" list and search results alike) rendered
faded and ignored mouse clicks.

- **Cause:** shadcn's `CommandItem` uses `data-[disabled]:opacity-50
  data-[disabled]:pointer-events-none`, which Tailwind compiles to the
  attribute-*presence* selector `[data-disabled]`. cmdk 1.1.1 renders
  `data-disabled="false"` on enabled items, so the attribute is always there and
  the rule always matched. Not just cosmetic — `pointer-events-none` meant the
  rows genuinely could not be clicked (arrow keys + Enter still worked).
- [x] Changed both to `data-[disabled=true]:` in `CommandItem`.
- [x] Also swapped `cursor-default` → `cursor-pointer` so rows read as clickable.
- [x] Checked the other three files using the presence selector
      (dropdown-menu, menubar, select) — all Radix, which emits
      `disabled ? "" : void 0`, so the attribute is omitted when enabled and
      those are already correct. Left alone.

Verified in the compiled stylesheet served by the dev server: it now contains
`.data-\[disabled\=true\]\:opacity-50[data-disabled="true"]` and the matching
pointer-events rule, and `CommandItem` no longer carries the presence-based
classes. Recorded the pattern in `tasks/lessons.md`.

---

# Task: Cancelling the logout confirmation froze the dashboard

## Cause
Not a focus-trap issue — a dependency-duplication one. `react-dismissable-layer`
stores the body's pre-lock `pointer-events` in a module-level variable and
restores it when the last layer unmounts. This repo has **two copies** of that
module (nested under `react-menu` and under `react-alert-dialog`), so:

1. Avatar menu opens (modal) → its copy saves `''`, sets `body.pointerEvents = 'none'`.
2. "Log out" clicked → AlertDialog mounts → *its* copy saves `'none'` as the original.
3. Menu unmounts → its copy restores `''`.
4. **Cancel** → dialog unmounts → its copy restores `'none'` → page permanently inert.

## Fix
- [x] `src/components/ui/dropdown-menu.tsx` — `DropdownMenu` now defaults to
      `modal={false}`, so a menu never sets the body lock and the dialog always
      records the correct original value. Documented inline; `modal` can still be
      passed explicitly.
- [x] Verified this was the right level to fix: only 3 files use `DropdownMenu`
      (header, leads, students) and **all three** open a dialog from a menu item,
      so leads and students had the identical latent freeze (delete → Cancel).
      None passed `modal`, so nothing regresses.

## Verification
- Confirmed the two dismissable-layer copies resolve to different paths, i.e.
  genuinely independent module state.
- Replayed the real mount/unmount logic (read out of the installed source) for
  both possible React effect orderings: the old modal default ends with
  `body.pointerEvents === 'none'` — reproducing the report exactly — while the
  new non-modal default ends with `''` in both orderings.
- `tsc` clean; `/admin/dashboard`, `/admin/students`, `/admin/leads` all HTTP 200
  after forcing a recompile.
- Lesson recorded in `tasks/lessons.md`.

## Recommended follow-up (needs the user's go-ahead)
The duplication is the real root cause and affects any overlapping Radix layers,
not just menus. Deduping via a `package.json` `overrides` entry pinning a single
`@radix-ui/react-dismissable-layer` would remove the whole class of bug — but it
rewrites the lockfile, so it was not done unasked.

---

# Task: Vercel build fails with `auth/invalid-api-key` (second occurrence)

## Finding
Not a code problem. A production build of the **same commit** (016aaab) with the
real `.env` values present succeeds: `EXIT=0`, `✓ Generating static pages (129/129)`.
So the Firebase env vars are still not reaching Vercel's build.

Most likely cause: Vercel prompts "Remove the public framework prefix to keep
this value private" when it sees `NEXT_PUBLIC_`. Accepting that renames the
variable, and `process.env.NEXT_PUBLIC_FIREBASE_API_KEY` then reads `undefined` —
producing exactly this error. The prefix is mandatory here: the Firebase client
SDK runs in the browser, so the values must be inlined at build time.

## Change made
- [x] `src/config/firebase.ts` — fail fast with a message that *names* the
      missing variables, instead of letting `getAuth()` throw
      `auth/invalid-api-key` while prerendering `/_not-found` (a page unrelated
      to Firebase; it only pulls this file in via the root layout's AuthProvider).
      The build still fails — deliberately. Masking a missing config would
      deploy a green build with no auth and no data, which is far worse.
- [x] Made `console.log("Firebase connected")` browser-only. It was printing
      immediately before the failure in the build log, implying success.

## Verification (isolated build copy, so the running dev server was untouched)
- Vars stripped, reproducing the Vercel state → `EXIT=1` and:
  `Firebase config missing: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID.`
- Real `.env` present → `EXIT=0`, `✓ Generating static pages (129/129)`.
- `tsc` clean.

## Note
The guard only reaches Vercel once it is committed and pushed; the failing
deployments are building 016aaab, which predates it.

---

# Task: Update the favicon

## Finding
The new icon was added at `public/favicon.ico`, but the repo **already had**
`src/app/favicon.ico` — the App Router convention file, which Next serves at
`/favicon.ico` automatically. Two files claiming the same route: `/favicon.ico`
was returning **HTTP 500**, so the site had no working favicon at all.

## Change
- [x] Copied the new icon into `src/app/favicon.ico` (the App Router location,
      which wins over `public/` and gets the cache-busting link tag for free).
- [x] Deleted the duplicate `public/favicon.ico` that caused the collision.
- [x] No metadata change needed — Next injects the link tag from the convention
      file. The old icon remains recoverable from git.

## Verification (clean production build in the isolated copy)
- `EXIT=0`, no favicon/conflict warnings.
- `.next/server/app/favicon.ico.body` md5 matches the new icon byte-for-byte.
- Route metadata: `{"status":200, "content-type":"image/x-icon"}` — was 500.
- Built HTML carries `<link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="32x32"/>`.

## Note
The running dev server still returns 500 for `/favicon.ico` — it cached the route
while both files existed. Restart it (`Ctrl+C`, then `npm run dev`) to clear that.

## Follow-up: whole site returned Internal Server Error

Every route (`/`, `/login`, `/admin/*`, `/student/*`, `/favicon.ico`) returned
HTTP 500 after the favicon change.

- **Not a code fault.** A second dev server started on port 9003 from the same
  source served every one of those routes with HTTP 200. The running server on
  9002 had cached the `/favicon.ico` route while `src/app/favicon.ico` and
  `public/favicon.ico` both existed, and Turbopack does not recover from that
  collision on its own — the poisoned entry took the whole module graph down.
- [x] Stopped both dev servers (the stale one on 9002 and the diagnostic one on
      9003 — two servers sharing a single `.next` risks further corruption).
- [x] Deleted `.next`.
- [x] Restarted `npm run dev` on 9002.

## Verification
All green on the restarted server, no errors in its log:

| Route | Status |
|---|---|
| `/` | 200 |
| `/login` | 200 |
| `/admin/dashboard` | 200 |
| `/admin/students` | 200 |
| `/admin/leads` | 200 |
| `/student/dashboard` | 200 |
| `/favicon.ico` | 200, bytes match the new icon |

---

# Task: Live-class status must be derived from the clock

## Cause
`status` was a **stored Firestore field**, set only by the "Mark as Live" /
"End Session" / "Reschedule" buttons. Nothing recomputed it, so it never
reflected the passage of time: a session scheduled for last week sat in the
database with `status: "Live"` and rendered LIVE NOW forever, and the buttons let
anyone mark a finished session live.

## Approach
Stop storing status; compute it. `src/lib/sessionStatus.ts` derives it from
`date + time + duration` versus the current time:

    now <  start            -> Scheduled
    start <= now <  end     -> Live
    now >= start + duration -> Ended

There is no writable status left to get out of sync, and the illegal state the
report describes is now unrepresentable rather than merely discouraged.

## Changes
- [x] `src/lib/sessionStatus.ts` (new) — pure derivation. Parses both stored time
      formats ("14:30" from the form, "2:30 PM" from older records) and both date
      shapes (string / Date / Firestore Timestamp). Builds dates from components,
      never `new Date("YYYY-MM-DD")`, which reads as UTC midnight and lands on the
      previous day west of Greenwich.
- [x] `src/hooks/use-now.ts` (new) — a Date that ticks every 30s, so a session
      flips Scheduled -> Live -> Ended on screen without a refresh.
- [x] `online-classes/page.tsx` — counts, All/Live/Scheduled/Ended tab filters,
      "next session" banner and row badges all read the derived status. Removed
      `handleStatusChange` and the three manual override buttons. Creating a
      session no longer writes a status field. Deleted the local duplicate of the
      date parser in favour of the shared one.
- [x] `live-classes/page.tsx` — counts, status filter and badges derived.
- [x] `timetable/page.tsx` — `isPast` / `isLive` derived.
- [x] `attendance/page.tsx` — badge and the "Open Meet Link" gate derived.
- [x] `meeting-link/page.tsx` — no longer writes a status field.
- [x] `src/data/onlineClassesData.ts` — `status` marked `@deprecated` and
      optional; kept so existing documents still typecheck.

## Verification
- 26 assertions against the extracted, transpiled logic with a frozen "now"
  (2 Sep 2026 10:30) so they cannot go stale: the three rules; the reported bug
  (a 2020 session reads Ended, not Live); exact boundaries (start inclusive, end
  exclusive); both time formats incl. 12 AM/12 PM; missing/garbage date, time and
  duration all falling back to Scheduled and never Live; zero duration not
  collapsing to instant-Ended; and no UTC off-by-one, incl. a session crossing
  midnight. All passed.
- `tsc --noEmit` clean across all five pages.
- All five routes return HTTP 200 with no compile errors.

## Note
Rescheduling is now done through Edit (which requires a future date/time), since
the manual "Reschedule" button would have been a status override.
