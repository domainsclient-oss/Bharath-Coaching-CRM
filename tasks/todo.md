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

---

# Task: Student portal login (Roll No + Password)

## Problem
The student portal at `/student/*` existed but had no way in. Everyone signed in
through `/login` with an email address, and `firestore.rules` granted **any**
authenticated user read/write on **every** collection — so a student account
would have had full CRM access from the browser console regardless of what the
UI showed.

## Approach
Roll numbers are mapped onto a reserved Firebase Auth domain:

    ROLL001  ->  roll001@students.bharathacademy.local

The mapping is pure (`src/lib/studentAuth.ts`), so the login screen never reads
Firestore before authenticating and the database never has to be opened to
unauthenticated reads. That domain is also the single source of truth for the
student role — in the app *and* in `firestore.rules` — so a student cannot be
promoted by editing a document, and a student whose user document goes missing
can no longer fall through the old `super_admin` bootstrap.

## Plan
- [x] `src/lib/studentAuth.ts` — roll number <-> address mapping, domain test.
- [x] `src/app/student-login/page.tsx` — Logo / Roll No / Password / Login,
      built from the same shadcn card as `/login`. Existing screens untouched
      apart from one "Student Login" link in the `/login` footer.
- [x] `authService.registerUser` — accepts a roll number in place of an email
      when the role is `student`, always forces the reserved domain, and
      resolves the matching `students` record so the portal never has to query
      for itself.
- [x] Admin settings Add User form — a real "Student Roll No" field replaces
      "Email" once the role is `student`, and the Role selector moved above it
      so the form reads in the order it is filled in. The users table column is
      now "Email / Roll No" and shows the roll number for students rather than
      the generated address, which is not a real mailbox.
- [x] `config/firebase.ts` — `getProvisioningAuth()`, an isolated Firebase app
      for account creation. Also fixes a pre-existing bug: adding a user used to
      sign the admin out and run the follow-up write as the new account.
- [x] `auth-context` — role pinned by login domain, students redirected out of
      `/admin/*`, logout and session-expiry return students to `/student-login`.
- [x] `firestore.rules` — students are read-only on their own rows and can write
      only their own test attempts, video history and portal preferences. Staff
      access is unchanged, including the first-run setup wizard.

## Verification
- 39 rules tests run against the Firestore emulator, all passing: staff keep
  full access; students can read their own fees, attendance, record and the exam
  schedule; students are denied writes to fees, marks, attendance and exams,
  denied all reads of staff, expenses and enquiries, denied any access to
  another student's rows, denied self-promotion and denied relinking their
  account to another student record.
- `npx tsc --noEmit` clean for every touched file (4 unrelated pre-existing
  errors remain in `admin/academics/subjects`, `admin/hr/report/yearly`,
  `admin/reports/alumni`, `admin/website/enquiries`).
- `npm run build` succeeds; `/student-login` is prerendered.

## Deploy note
`firebase deploy --only firestore:rules` is required — the restrictions do
nothing until the new rules are live. If `NEXT_PUBLIC_STUDENT_LOGIN_DOMAIN` is
ever changed, the regex in `firestore.rules` must change with it.

## Follow-up applied
The first cut reused the existing Email field for roll numbers to avoid touching
the UI. That was confusing in practice, so the form now has a labelled roll
number field. Behaviour is unchanged underneath.

## Known gap
An admin who creates a portal login before the student's record exists gets a
user document with no `studentId`. The login works, but the dashboard has no
record to read. Recreate the login after adding the student.

---

# Task: Wire the student portal menu to live data

## Problem
Only three of the eight sidebar items read Firestore, and two of those read
collections the admin never writes to, so they were permanently empty:

| Menu item     | Was reading            | Admin actually writes |
|---------------|------------------------|-----------------------|
| My Attendance | `attendance`           | `studentAttendance`   |
| Homework      | `studentHomework` only | `homework` per class  |
| My Timetable  | mock data              | `timetable` per slot  |
| Tests & Exams | mock data              | `onlineExams`         |
| My Profile    | mock data              | `students`            |
| Announcements | mock data, 404 link    | `websiteNews`         |

Announcements also pointed at `/student/communication`, a route that has never
existed, so the menu item 404'd.

## Approach
`src/hooks/useStudentRecord.ts` resolves the signed-in student once and every
page reads from it: the `students` document id, the record, and the matching
`classes` document id. The class link needs translating — student records store
`class` as "10" while `classes` documents are named "Class 10" — so the hook
applies the same normalisation the admin attendance screen already uses.

Class-scoped queries filter by branch in Firestore and match the class in
memory, because admins type it both ways depending on the screen. Sorting is
also done in memory so none of this needs a composite index.

## Plan
- [x] `useStudentRecord` hook — student id, record, class id, branch.
- [x] Profile, Attendance, Homework, Fees, Timetable, Tests, Announcements all
      read live data, each with a loading skeleton, an empty state, and a clear
      message when the login has no student record behind it.
- [x] Sidebar Announcements now points at `/student/notices`.
- [x] Test-taking page reads `onlineExams` rather than `exams`, and its
      countdown uses `durationMins` instead of `totalMarks`.
- [x] `firestore.rules` grants students read access to the collections the
      portal now uses, and write access only to their own homework ticks.

## Verification
- 23 rules tests against the Firestore emulator, all passing: every menu item's
  read succeeds; students are denied another student's attendance, records,
  fees and homework ticks, denied edits to homework, timetable, online exams and
  website news, and denied all reads of staff and expenses. Staff access
  unchanged.
- `npx tsc --noEmit` clean for every touched file.
- All eight menu routes serve 200.

## Not done
The test submit flow still deletes the attempt on submit and redirects to
`/student/results/{id}`, a route that does not exist, and the result page still
reads mock data. Scores therefore never persist, so a completed test will not
appear under the Completed tab.

## Follow-up: student dashboard restyled to match admin

The dashboard now uses the admin design language — `#F5F7FA` page ground, the
teal context banner, left-accent KPI cards in the `#0D7C8F` / `#1E2A4A` /
`#E8A020` / `#059669` palette, `border-none shadow-sm` section cards with
`text-lg font-bold text-[#1E2A4A]` titles, bordered list rows, and the same
quick-action tile grid.

`SharedHeader` was deliberately NOT reused: it carries the branch switcher and
global CRM search, neither of which a student may have.

Three latent crashes were fixed along the way. The old page called `.toDate()`
on exam and homework dates that are plain strings, and read `subject`,
`teacher` and `time` from timetable slots whose fields are `subjectName`,
`teacherName` and `timeSlot`. `studentDashboardService` was rewritten to read
the same collections the detail pages use, so the summary and the detail agree,
and each section fails independently rather than blanking the page.

The dashboard also no longer depends on the admin branch switcher — it uses the
branch on the student's own record.

## Follow-up: removed the duplicate G Meet Classes screen

The sidebar carried two sections for one feature. Both read and wrote the single
`onlineClasses` collection and both had a submenu labelled "Live Classes", so
the menu implied two kinds of class where only one exists.

`/admin/online-classes/live-classes` was a second, read-mostly view of the same
rows. Everything it offered except three things already existed on the main list,
so those three moved to `/admin/online-classes` and the page was deleted:

- a class filter select beside the search box
- a copy-to-clipboard button on each session's meet link
- a one-click "Generate link" for a session that has none

Search on the main list now also matches faculty name, which the removed page
did and the main list did not.

Nav is one "Online Classes" group with four submenus: Live Classes, Students
Attendance, Online Timetable, Live Meeting Link. The meeting-link breadcrumb
that pointed at the deleted route now points at the list.

Nothing was lost from the data layer. No collection, field, or write path
changed, and `/admin/online-classes/meeting-link` still creates sessions.

Verified with `npm run build`: it succeeds and emits four online-classes routes,
with the live-classes route gone. `npm run typecheck` reports the same four
pre-existing errors in unrelated pages (academics/subjects, hr/report/yearly,
reports/alumni, website/enquiries) and none in the touched files.

Worth flagging separately: both link generators build a random string shaped
like a Meet URL. No Google API is called, so generated links do not open a real
meeting. That was true before this change and is still true.

## Follow-up: single-branch (Trichy only)

The academy runs from Trichy alone, so Chennai, Coimbatore and Madurai were
removed from every list that defines which branches exist:

- `src/context/BranchContext.tsx` — `FALLBACK_BRANCHES`, used when Firestore
  has no `branches` documents. This is what feeds the header switcher.
- `src/app/admin/settings/page.tsx` — `DEFAULT_BRANCHES`, which Settings ›
  Branches writes to Firestore whenever the collection is empty. This was the
  real source of the four branches.
- `src/lib/seedFirestore.ts` — the demo seeder now generates Trichy data only.
- `src/data/branchData.ts` and `src/data/settingsData.ts` — unused fixtures,
  trimmed so the branches cannot creep back in.
- `src/data/studentsData.ts`, `hrData.ts`, `academicsData.ts` — unused demo
  rows retargeted from other branches to Trichy.

Multi-branch support itself is untouched. Every page still filters by
`currentBranch`, `BranchProvider` still reads the `branches` collection, and
Settings › Branches can still add a branch. Only the defaults changed.

The header shows nothing about branch while there is only one. In
`shared-header.tsx` the divider, map pin and branch name are all inside a
`branches.length > 1` guard, so a single-branch academy gets a clean header and
the picker reappears by itself the moment a second branch is added. The legacy
`header.tsx` dropdown hides on the same condition.

IMPORTANT — one manual step remains. `BranchProvider` prefers Firestore over the
fallback, so if the `branches` collection already holds the four seeded
documents the switcher will keep showing them. Delete Chennai, Coimbatore and
Madurai in Settings › Branches. Leaving Trichy in place stops the auto-seeder
from firing, since it only runs when the collection is empty.

Records already written under another `branchId` stay in Firestore but become
unreachable in the UI, which is expected for a branch that no longer exists.

Verified: typecheck clean apart from the same four pre-existing errors, and
`/`, `/login`, `/admin/dashboard`, `/admin/settings`, `/admin/students` and
`/admin/online-classes` all return 200 with no dev-server errors.

## Fix: alumni WhatsApp page crashed on an empty Select option

Opening Alumni › WhatsApp threw "A <Select.Item /> must have a value prop that
is not an empty string" from the Batch filter.

Root cause was in the batch-year helper:

    s.discontinuedDate?.slice(0, 4) ?? s.admissionDate?.slice(0, 4) ?? "—"

Optional chaining only guards null and undefined. A student row whose
`discontinuedDate` is an empty string takes the first branch, because
`""?.slice(0, 4)` is "" and `??` does not fall through on an empty string. That
"" was not equal to the "—" placeholder, so it survived the filter and reached
`<SelectItem value="">`, which Radix rejects at render time.

The same helper was duplicated verbatim in `/admin/reports/alumni`, which had
the identical latent crash. Both now import one implementation from
`src/lib/alumni.ts`, which returns a four-digit year or `UNKNOWN_BATCH` and
handles empty strings, missing fields, partial dates and Firestore Timestamps.

Also fixed while there: the class filter on the alumni report typed its options
as `(string | undefined)[]`, which was one of the four standing typecheck
errors. It now asserts `string[]` after the `filter(Boolean)`.

Verified: the helper returns a valid year or the placeholder for empty, missing,
null, partial and Timestamp inputs, never "". Both pages return 200 with a clean
dev log, and typecheck is down to three pre-existing errors from four.

## Follow-up: Branch ID removed from the Add User form

Settings › Users asked for a Branch ID on every new user, with the hint
"e.g. Trichy (leave blank for all)". With one branch there is nothing to
choose, so the input is hidden behind `!onlyBranchId` and reappears once a
second branch exists — the same rule the header switcher uses.

New users are now tagged with the only branch automatically rather than left
blank. Blank means "all branches" in the users table, and while the two are
equivalent today, an explicit tag keeps audit-log entries specific and keeps the
records correct if a second branch is ever added.

Editing an existing user does not rewrite their branch. A super_admin
deliberately left blank stays blank, since blank is a real setting and not a
missing value.

Nothing else reads a user's `branchId` for access control — pages scope by
`currentBranch` from `BranchProvider`, and the field only feeds audit logging in
`auth-context.tsx` and `authService.ts`.

## New page: Students Detail (offline / online)

Added `/admin/students/offline` and a "Students Detail" item under Students
Records, between Online Admissions and Discontinued.

Layout follows the requested spec:

- Heading "Students Detail" with a mode dropdown, defaulting to offline. The
  same page serves online students, so there is no second screen to maintain.
- Required Class, Board and Subject selects, each marked with a red asterisk.
  Search stays disabled until all three are chosen.
- Columns: Application No, Student Name, Class, Board, School Name, Subject.

Design decisions worth recording:

- Nothing is listed until Search is pressed. `applied` holds the criteria of the
  last search that actually ran, so the table cannot show the whole roll before
  anything is asked for.
- Mode is filtered client-side, not passed to `useFirestoreCollection` as a
  condition. That hook keeps its conditions in a ref and does not re-subscribe
  when they change, so a mode switch through the query would have returned stale
  rows. Client-side filtering also avoids needing a composite Firestore index.
- Subject options are derived from the students on record rather than the
  subjects master collection, so every subject offered has at least one student
  behind it and a search can never come back empty because of a naming mismatch.
- A record with no `mode` counts as Offline, matching the student form, which
  defaults new admissions to Offline.
- Switching mode clears the chosen subject and the results, since the subject
  list is mode-specific.
- Student Name links to the student record. No extra actions column was added,
  to keep the six columns as specified.

Verified: typecheck reports nothing for the new file, the route returns 200, and
the search predicate was tested against a sample roll covering mode mismatch,
board mismatch, class mismatch, subject mismatch, padded subject strings, a
missing mode field and a missing subjects array. All cases behaved correctly.

Note on verification limits: every admin page in this app renders client-side
only, so an unauthenticated HTTP request returns an empty shell. The 200 proves
the route compiles and serves, not that the UI looks right. Confirm the layout
in the browser while signed in.

---

## Student portal auth gate + logout

Reported: /student/dashboard rendered for a visitor who had not logged in, and
the student portal had no way to log out.

- [x] Gate every /student route behind an authenticated student session
- [x] Add a logout control to the student sidebar

### Changes

- `src/components/auth/require-student.tsx` (new) — renders a spinner instead of
  the page until the session is known to belong to a student. Signed-out
  visitors are sent to /student-login, staff to /admin/dashboard, both with
  `router.replace` so the back button cannot restore the portal.
- `src/app/student/layout.tsx` — wraps the whole portal (sidebar included) in
  that guard, so all 17 student routes are covered by one change.
- `src/components/layout/student-sidebar.tsx` — footer showing the signed-in
  student's name and roll number, with a confirm dialog before logout. Mirrors
  the admin sidebar footer and reuses the same `logout` from the auth context,
  which already routes students to /student-login.

### Why the layout and not the pages

The auth provider's redirect effect runs after the tree paints, so the portal
was already on screen when the redirect fired. Gating at the layout stops the
render itself rather than racing it, and covers every current and future
student route.

### Verification

Production build succeeds. Typecheck reports nothing for the three touched
files; the pre-existing admin errors are unrelated. A headless browser load of
/student/dashboard with no session ends on the student login form with no
dashboard content in the DOM.

Not verified: the sidebar footer while signed in, which needs real student
credentials. Confirm in the browser.

---

## Student login bounced to the admin dashboard

Reported: opening /student-login landed on the admin dashboard instead of the
student login form.

- [x] Let /student-login be reachable while another session is open
- [x] Confirm a successful student login lands on /student/dashboard

### Cause

The auth provider sent *any* signed-in user away from *any* login page, to
whichever dashboard their own role implied. With a staff session open, opening
the student door therefore jumped straight to the CRM, and no student could be
signed in without logging the admin out first.

### Changes

- `src/lib/auth-routes.ts` (new) — the routing rule as one pure function,
  `resolveAuthRedirect(pathname, session)`, plus the four route constants. A
  signed-in user now skips a login screen only at their own door; at the other
  door the form is shown, and signing in replaces the session.
- `src/lib/auth-context.tsx` — the redirect effect is now a single call to that
  function. It uses `router.replace`, so a redirect nobody asked for no longer
  lands in the browser history.
- `src/lib/auth-context.tsx` — a session counts as a student if either the
  address is on the reserved student domain *or* the role resolved upstream
  from the real Firebase Auth address says so. Previously only the first was
  checked, against the Firestore document's address, which an admin can edit
  off the domain — a student read as staff would be handed the CRM on login.

### Verification

17 routing cases exercised directly against the pure function, covering visitor,
student, teacher, admin and roleless sessions at both doors, both dashboards and
the setup wizard. All pass. Production build succeeds and typecheck reports
nothing for the touched files. In a headless browser, /student-login shows the
roll-number form instead of redirecting, and /student/dashboard with no session
still lands on that form.

Not verified: the signed-in cases in a real browser, which need student and
staff credentials.

---

## Single-branch cleanup: dashboard banner and Add Branch

The academy operates from Trichy only, so a branch label and a way to add
branches are both noise. The banner was also printing the raw Firestore
document id (`KMOPE9HcgCHkOfXdVfAr`) rather than the branch name.

- [x] Hide the "Viewing: … Branch" banner while only one branch exists
- [x] Show the branch name, not the document id, if a second branch appears
- [x] Remove the Add Branch option from Settings › Branches

### Changes

- `src/app/admin/dashboard/page.tsx` — the banner renders only when
  `branches.length > 1`, and resolves the id to a name through the branch list,
  the same lookup the header already uses. Nothing is deleted, so the banner
  returns correctly the day a second branch is opened.
- `src/app/admin/settings/page.tsx` — dropped the Add Branch button and its
  `openAdd` handler; `handleSave` is now an edit-only path guarded on
  `editing`; the dialog title is fixed to "Edit Branch"; the tab description
  and the empty-state row no longer promise an add that is gone.

### Why conditional rather than deleted

The whole data layer keys off `branchId` and every service call is
branch-scoped, so the multi-branch model stays. Only the UI that presumes more
than one branch is hidden. This follows the pattern already in the settings
page, where the branch field on the user form hides itself when there is a
single branch.

### Open item

Settings › Branches still has a Delete button on the only branch. Deleting it
re-seeds a fresh "Trichy" document, but every record already tagged with the
old branch id would be orphaned, and Add is no longer there to undo it. Worth
hiding Delete for the last remaining branch.

### Verification

Production build compiles. Typecheck reports nothing for either touched file.
Both /admin/dashboard and /admin/settings return 200 from the dev server. The
rendered result needs a signed-in browser check.

---

## Fix: /student/dashboard sent staff to the admin dashboard

Reported from the deployed site. Opening /student/dashboard landed on the
admin dashboard instead of the student portal or the student login.

- [x] Send every non-student who opens /student/* to the student login
- [x] Confirm no redirect loop against the shared routing policy

### Cause

The `RequireStudent` guard I added earlier redirected a signed-in non-student
to `/admin/dashboard`. Testing happened with an admin session open, so the
guard fired every time. Signed-out visitors were always routed correctly; the
wrong destination only showed up with a staff session in the browser.

### Change

`src/components/auth/require-student.tsx` now redirects to `STUDENT_LOGIN` for
anyone who is not a student, importing the constant from `src/lib/auth-routes.ts`
rather than hardcoding a path. `resolveAuthRedirect` already leaves a staff
session alone at the student door, so the guard and the provider agree and
nothing bounces back.

### Verification

Compiled `auth-routes.ts` with esbuild and ran all twelve combinations of
{signed out, student, staff} against the student pages, the admin pages and
both login screens, following each redirect chain to a fixed point. All twelve
settle on the expected path with no loop. Production build compiles, typecheck
is clean, and a headless load of /student/dashboard with no session ends on the
roll-number login form with no admin or student dashboard content in the DOM.

---

## Remove the branch id from student-facing labels

The student greeting showed the branch's Firestore document id
(`KMOPE9HcgCHkOfXdVfAr Branch`) next to the class and date.

- [x] Drop the branch segment from the dashboard welcome line
- [x] Drop the matching Branch badge from the student profile

### Changes

- `src/app/student/dashboard/page.tsx` — the welcome line is now class and
  date. `branchId` is still read from `useStudentRecord`, because the dashboard
  query is branch-scoped; only the label is gone.
- `src/app/student/profile/page.tsx` — removed the `Branch:` badge beside
  `Class:`, and the now-unused `branchId` from the destructure.

A student attends the one branch there is, so neither label carried
information. The admin dashboard banner was handled separately: it is hidden
below two branches and resolves the id to a name above them.

### Verification

Production build compiles, typecheck is clean on both files, both routes
return 200, and no "Branch" text remains in either page.

---

## Redesign of /student/profile

The record read as an unaligned dump: labels started at different x positions,
dates showed as raw ISO strings, and the Address section repeated its own
heading as the only row label.

- [x] Align every label and value on a shared grid
- [x] Give every value a distinct label
- [x] Format stored dates for reading
- [x] Group the fields into titled sections

### Changes (all in `src/app/student/profile/page.tsx`)

- **Alignment.** The old `InfoRow` took an `icon` prop that most callers filled
  with an empty fragment, so rows with an icon were indented and rows without
  were not. Replaced by a `Field` row on a `sm:grid-cols-[11rem_1fr]` grid:
  labels share one column, values share another, and rows stack label-over-value
  below the `sm` breakpoint.
- **Sections.** Four cards — Personal Details, Contact & Address, Guardian
  Details, Academic Background — each with an icon chip and title, matching the
  card style of the fees and attendance pages. The grid uses `items-start` so a
  short card no longer stretches to match a tall neighbour.
- **No repeated headings.** Contact and address share one card, so no card
  restates its own title as a row label. An address stored as an object gets a
  labelled row per part (Street, City, State, Pincode).
- **Dates.** `2010-09-11` now reads `11 September 2010`. The parser handles ISO
  strings, Firestore Timestamps and Dates, and reads a plain `YYYY-MM-DD` as a
  local date so it cannot slip a day west of Greenwich. Unparseable values are
  shown as stored rather than dropped.
- **Empty values.** A muted "Not on record" replaces the bare `-`.
- **Identity band.** Avatar, name, class, roll number and status across the top,
  instead of an avatar column vertically centred against a long detail list.

### Verification

Rendered the page with the reported record through a temporary route carrying
fixture data, screenshotted at desktop and narrow widths, then deleted the
route. Labels and values line up in both. A DOM probe measured viewport width,
document scroll width and the right edge of every element at 500px each, so the
page has no horizontal overflow. Production build compiles, typecheck is clean,
and /student/profile returns 200.

### Note

The student sidebar is a fixed 256px column with no responsive collapse, so on
a phone it takes most of the screen on every student page. That is pre-existing
and untouched here.
