# Student portal — make the eight sidebar screens show real data

Scope set by the user: the eight screens in the student sidebar only. The mock
pages outside the sidebar (`/student`, `/student/progress`, `/student/resources`,
`/student/question-papers`, the online test take/result screens) are out of scope
and stay untouched.

Same class of bug as the timetable: each screen already queries Firestore, so the
job is to prove every field it reads matches what the admin screen actually
writes, and fix the mismatches that leave a screen empty or wrong.

## Audit

| Screen | Verdict |
|---|---|
| My Timetable | Fixed earlier — day key and class match |
| My Attendance | Correct. Reads `studentAttendance` by `studentId`, which is what the admin attendance screen writes |
| Homework | Correct. Reads `homework` by branch, matches class on the normalised form |
| Tests & Exams | Correct. Reads `onlineExams` by branch, hides drafts, reads `testAttempts` by student |
| Announcements | Correct. Reads `websiteNews` by branch and hides unpublished items |
| Dashboard | Correct once the timetable day key was fixed |
| **Fee Payments** | **Broken.** Reads a schema that was never written |
| **My Profile** | **Half empty.** Reads guardian and address fields the admissions form never writes |

## Defects to fix

Fees:
- [ ] 1. Reads `totalAmount`; the admissions screen writes `totalFee`. Calling
      `.toLocaleString()` on the missing field throws, so the page breaks as soon
      as the student has one fee row
- [ ] 2. Reads `description`, which is never written. Blank column
- [ ] 3. `formatDate` assumes a Firestore Timestamp and reads `.seconds`, but the
      admin writes a plain "YYYY-MM-DD" string, so every date renders Invalid Date
- [ ] 4. Payment history reads a `payments` collection that nothing in the app
      ever writes, so it stays empty however much the student has paid

Profile:
- [ ] 5. Guardian card reads father/mother name and occupation, none of which the
      admissions form writes. The real field is `parentName`, with phone and
      WhatsApp beside it
- [ ] 6. City and pincode are stored as their own fields but only read out of an
      address object, so they never appear
- [ ] 7. Board, medium, study mode, subjects and application number are all on the
      record and none of them are shown

Shared:
- [ ] 8. One date helper for Timestamp, Date and "YYYY-MM-DD", instead of a
      private copy per page
- [ ] 9. Verify: typecheck, build, load every student route

## Review

(to be filled in)

## Review — completed 2026-09-11

All eight sidebar screens verified against what the admin side writes. Six were
already correct. Two were not, and both are fixed.

**Fee Payments** was the serious one. The page was reading a `Fee` model in
`src/models/fee.ts` that no screen has ever written:

- it read `totalAmount`; the office writes `totalFee`. Calling `.toLocaleString()`
  on the missing field threw a TypeError, so the page broke for any student who
  had a fee raised against them. Proven by running the old expression against a
  document shaped as `/admin/fees/add` writes it
- it read `description`, never written. Now falls back through fee type and
  subjects, keeping `description` for older records
- its date helper read `.seconds` off a Firestore Timestamp, but the office writes
  a plain "YYYY-MM-DD" string, so every date read Invalid Date
- payment history queried a `payments` collection that nothing in the app writes.
  The office collects against the bill itself, so the history is now built from
  the bills, one line per bill, and still prefers real `payments` documents if a
  branch ever starts filing them
- added a billed / paid / balance summary above the tables

**My Profile** was showing "Not on record" against data the record holds:

- the guardian card read father and mother name and occupation, none of which the
  admissions form writes. It now leads with `parentName` and the contact number,
  and shows the father and mother rows only when an older record carries them
- city and pincode are stored as their own fields but were only read out of an
  address object, so they never appeared
- board, medium, study mode, subjects and application number were all on the
  record and none were shown. All added

**Shared:** `src/lib/firestoreDate.ts` reads Timestamps, Dates and "YYYY-MM-DD"
strings, replacing the private copy that lived in the profile page.

**Verification**
- `tsc --noEmit` clean for every changed file
- production build compiled successfully in 69s
- all eight student routes plus `/login` return 200 with no errors in the dev log
- fee rendering checked against a real-shaped document, before and after a part
  payment, plus a legacy record written against the old model

**Out of scope by the user's decision:** `/student`, `/student/progress`,
`/student/resources`, `/student/question-papers` and the online test take and
result screens are still on mock data. The test flow in particular is broken:
taking a test renders 20 invented questions instead of the real paper, submitting
grades nothing and redirects to `/student/results/[id]`, a route that does not
exist. None of these are reachable from the student sidebar.
