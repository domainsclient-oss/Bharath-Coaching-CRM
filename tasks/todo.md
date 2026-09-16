# CSV import for /admin/students

Add a way to import student records from a CSV file, leaving the existing page
exactly as it is.

## Constraint

"Without affecting existing UI and content." So the students page gains one
button beside Export CSV and nothing else. All the new work lives in its own
files, and the existing table, filters, cards and actions are untouched.

## Files

- [ ] 1. `src/lib/parseCSV.ts` — new. Text to rows, handling quoted fields,
      embedded commas and newlines, escaped quotes, CRLF and the Excel BOM
- [ ] 2. `src/components/students/import-students-dialog.tsx` — new. The whole
      flow: pick a file, map the columns, validate, preview, write
- [ ] 3. `src/app/admin/students/page.tsx` — one Import CSV button and the
      dialog. No other change

## Decisions

- **Round trips with the existing export.** A file exported from this page can
  be imported straight back. Column names are matched loosely, so "App No",
  "appNo" and "app_no" all land in the same field, and "Class 9" reduces to "9"
  through the same helper the rest of the portal uses
- **Only what the file says.** Missing optional columns are left empty rather
  than filled with assumptions. The system fields are set the way the Add
  Student form sets them: generated application and roll numbers, status Active,
  mode Offline, today's admission date, the current branch
- **Name and class are required.** A row missing either is reported, not written
- **Duplicates are skipped, not merged.** Matched on application number when the
  file gives one, otherwise on name plus phone, both against existing students
  and against earlier rows in the same file
- **`createdAt` is written explicitly.** The list orders by it, and Firestore
  drops documents that lack the field it is ordering on, so an imported student
  without it would never appear on the page that imported them
- **Nothing is written until the preview is confirmed.** Errors are listed with
  their row numbers first
- **Batched in chunks.** Firestore allows 500 writes per batch

## Verify

- [ ] 4. Parser against quoted commas, embedded newlines, escaped quotes, CRLF, BOM
- [ ] 5. Round trip: export columns map back to the right fields
- [ ] 6. Validation and duplicate rules
- [ ] 7. Typecheck, build, page loads, existing UI unchanged

## Review

(to be filled in)

## Review — completed 2026-09-11

Done. The students page gained one button; everything else is new files.

**What changed on the existing page** — four additions and no deletions:
an icon import, the dialog import, one piece of state, the Import CSV button
beside Export CSV, and the dialog mounted next to the delete confirmation. The
table, filters, cards, pagination and every existing action are byte for byte
what they were.

**New files**
- `src/lib/parseCSV.ts` — the counterpart to `exportToCSV`. Walks the text once
  so a quoted field can hold a comma, a newline or an escaped quote, and copes
  with CRLF and the byte order mark Excel writes
- `src/components/students/import-students-dialog.tsx` — the whole flow

**How it behaves**
- Choose a CSV, and the file is read and checked before anything is saved. The
  dialog shows rows in the file, ready to import, and skipped, then lists every
  skipped row with its line number and the reason, then previews what would be
  written. Only then does the Import button do anything
- Column names are matched loosely, so "App No", "appNo" and "app_no" all land
  in the same field, and a column nobody recognises is listed as ignored rather
  than silently dropped
- A file exported from this page imports straight back. "Class 9" reduces to "9"
  through the same helper the rest of the portal uses
- Name and class are required. Duplicates are skipped, matched on application
  number when the file gives one and on name plus phone otherwise, against both
  the existing students and earlier rows in the same file
- Blank optional columns stay blank. Only the fields the CRM needs to file a
  record are filled in: generated application and roll numbers, status Active,
  mode Offline, today's admission date, the current branch
- A template with the full column list and one filled-in example is downloadable
  from the dialog
- Writes go in batches of 400, under Firestore's limit of 500

**One trap worth recording:** the students list orders by `createdAt`, and
Firestore leaves out documents that lack the field it is ordering on. `batchWrite`
only sets `updatedAt`, so an imported student would have been written correctly
and then been invisible on the very page that imported them. The import sets
`createdAt` explicitly.

**Verification**
- Parser: 15 checks covering quoted commas, embedded newlines, escaped quotes,
  CRLF, the Excel byte order mark, blank lines, empty cells, a header-only file
  and empty text. All pass. Run against the compiled module, not a copy of it
- Mapping and rules: an eight row file exercising a loose header, a stray column,
  "10th" as a class, a duplicate application number, a duplicate name and phone,
  a missing name, a missing class and a row repeated inside the file. Two rows
  accepted, five skipped with the right reason each, exactly as intended
- `tsc --noEmit` clean, page loads, no errors in the dev log

---

## Merge "Due Fees" into "Balance Fees"

Two pages read the same `fees` collection for the same branch and differed only
by a `balance > 0` filter. Balance Fees additionally showed fully paid records
under a heading that said "Balance Dues", which duplicated Search Fees, and the
two pages disagreed on "Students with Dues" — Balance counted distinct students,
Due counted rows.

**What the merged page keeps**
- From Due Fees: data-driven Class and Board dropdowns, the Subjects column,
  Bill No first, the Overdue Only pill with its count, the working WhatsApp
  reminder, the Collect button with its icon
- From Balance Fees: the Status dropdown, the Status badge column, the Clear
  Filters button, the distinct-student count, the "+ Add Fee Record" empty state
- The two scopes are now a toggle: Outstanding Only (default, `balance > 0`) and
  All Records. Nothing either page could show is unreachable

**Fixes folded in**
- "Students with Dues" counts distinct students everywhere
- Overdue is one string comparison on `YYYY-MM-DD` — Balance used a `Date`
  built once at module load, so a tab left open overnight judged it wrong
- Summary cards follow the filters and carry the branch-wide figure alongside,
  so a narrowed list never hides the real total

**Files**
- `src/app/admin/fees/balance/page.tsx` — merged page
- `src/app/admin/fees/due/page.tsx` — redirect to `/admin/fees/balance`, so
  bookmarks and the notification link in `use-notifications.tsx` keep working
- `src/components/layout/admin-nav.ts` — one entry, "Balance / Due Fees"

**Verification**
- `tsc --noEmit` clean for both files; remaining errors are pre-existing and in
  unrelated pages
- `npm run build` compiles; `/admin/fees/balance` builds at 5.43 kB and
  `/admin/fees/due` at 143 B, the size of the redirect stub

**Still open:** `/admin/fees/due-tracking` is not in the nav and still runs on
`mockFeeRecords`. It is the only page with instalment-level aging buckets.

---

## Collect Fees: show the list on arrival

The table was gated behind a `searched` flag, so `/admin/fees/collect` opened
empty until someone pressed Search. Once pressed, filtering was already live.

- Removed the gate: every fee record for the branch is listed on arrival, and
  Name / Class / Board narrow it as you type
- Search button and Enter still work; since filtering is live they just leave
  the input
- Clear appears whenever a filter has a value, rather than only after a search
- Added a loading spinner, so the table no longer flashes "No fee records found"
  while Firestore answers; the empty message now says whether filters caused it

**Verification:** `tsc --noEmit` clean for the file; the page returns 200 from the
running dev server. No production build was run while dev was up (see lessons.md).

---

## One board list: CBSE, SAMACHEER, ICSE, IGCSE, IB, ONE TO ONE

Board dropdowns were hard-coded separately on 17 pages, with spellings that
disagreed ("State", "State Board", "Samacheer"), and three more were built from
whatever values happened to be in Firestore.

- `src/config/boards.ts` holds `BOARDS` and `BOARD_FILTER_OPTIONS` ("All" first).
  Every board dropdown imports from it — 20 files
- Form dropdowns use `BOARDS`; filter dropdowns use `BOARD_FILTER_OPTIONS`
- fees/balance, reports/students and alumni no longer derive boards from data,
  so stray values stop appearing in their dropdowns
- academics/classes KPI card counted `"State"`; now counts `"SAMACHEER"`
- Badge colour maps in reports/students and reports/alumni gained SAMACHEER,
  IGCSE and ONE TO ONE; the old keys stay so existing records still colour

**Verification:** `tsc --noEmit` clean for all changed files (the one error in
academics/subjects line 105 is pre-existing — identical at HEAD, about `type`).
No hard-coded board list remains. 12 affected pages return 200 from dev.

**Still open — existing data:** records already saved with "Samacheer" or "State"
keep those values. Filters compare exactly, so choosing SAMACHEER
will not match a record stored as "Samacheer", and "State" records match no
option. Needs a one-off Firestore migration across students, fees, leads,
classes, subjects, alumni and exams.

---

## Batches: Class + Board + Mode

**Model**
- Class = grade 1–12, fixed list (`src/config/academics.ts`)
- Board = CBSE, SAMACHEER, ICSE, IGCSE, IB (`src/config/boards.ts`; ONE TO ONE removed)
- Mode = Offline, Online, One to One (`src/config/academics.ts`)
- Batch = one `classes` document per unique Class + Board + Mode

**Compatibility rule — why the site keeps working**
14 pages read the `classes` collection and use `name`, `board`, `mode`.
Attendance reads the grade by stripping "Class " from `name`; leads/add dedupes
on it. So a batch keeps `name: "Class 10"` exactly, and gains `classNumber: "10"`.
The full "Class 10 - CBSE - Offline" label is built for display, never stored.
No document shape changes, no field is removed.

**Plan**
- [ ] `academics.ts`: CLASSES, MODES, filter options, `batchLabel`, `batchKey`
- [ ] Remove ONE TO ONE from BOARDS
- [ ] Academics → Classes becomes Batches: Class / Board / Mode dropdowns, no
      free-text name, duplicate combinations refused, student count computed
      from real students, legacy records flagged "Needs update" (not deleted)
- [ ] Students list: Class 1–12 once each; Mode filter gains One to One
- [ ] Students online / offline / discontinued / application: Class 1–12
- [ ] Student form: Class 1–12; third mode card, One to One
- [ ] Verify: tsc on changed files, pages 200 on running dev server, no build
