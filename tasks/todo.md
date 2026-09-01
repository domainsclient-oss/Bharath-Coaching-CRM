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
