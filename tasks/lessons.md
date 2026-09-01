# Lessons

## Never `git stash` to get a "clean baseline" in this repo

**What happened:** To compare typecheck errors before/after a change, I ran
`git stash && tsc && git stash pop`. The pop **failed** — `tsconfig.tsbuildinfo`
is a *tracked* build artifact that `tsc` had just rewritten, so git refused to
overwrite it. That left ~75 files of the user's uncommitted work sitting in a
stash entry with the working tree reverted to HEAD.

**Why it's dangerous here:** This repo habitually carries a large uncommitted
working tree, and it tracks generated files (`tsconfig.tsbuildinfo`) that build
commands mutate. Any stash/pop cycle around a build command can deadlock.

**How to apply:**
- Don't stash to establish a baseline. Read the HEAD version directly
  (`git show HEAD:path/to/file`) or just scope the check to the files touched:
  `npx tsc --noEmit | grep -E "file-a|file-b"`.
- If a stash is genuinely unavoidable, `git stash -u` and verify the pop
  succeeded before doing anything else — a failed pop is silent unless checked.
- Recovery: the stash entry is *kept* on a failed pop. Discard the blocking
  artifact (`git checkout -- tsconfig.tsbuildinfo`) then pop again.

## Radix modal layers leak a body lock across navigation

**What happened:** After logout the `/login` page rendered but was completely
inert — inputs unfocusable until a hard refresh.

**Root cause:** Radix locks `<body>` with `pointer-events: none` while a modal
layer (AlertDialog/DropdownMenu) is open and undoes it in its close cleanup.
Logout ran `router.push('/login')` from *inside* the confirm dialog, unmounting
the whole layer before that cleanup could run, so the lock leaked onto the next
page.

**How to apply:** Any time an action navigates away from inside a Radix overlay,
the overlay's cleanup is not guaranteed to run. Release the lock explicitly —
see `src/lib/release-ui-lock.ts`. Symptom to recognise: "page looks fine but I
can't click or type, works after refresh" ⇒ check `document.body` inline styles,
not the component.

## Firestore date fields in this repo are not reliably strings

**What happened:** The notification feed typed `enquiries.followUpDate` and
`fees.dueDate` as `string` — which is what the current forms write — and sorted
with `.localeCompare()`. It crashed in production data with
`localeCompare is not a function`: older records hold **Firestore Timestamps**
in those same fields.

**Why it's easy to miss:** The `interface FeeDoc` declarations scattered across
the page components all say `dueDate?: string`, so TypeScript happily agrees.
Those interfaces describe what the *newest* writer produces, not what the
collection actually contains — Firestore has no schema to enforce them, and this
project has been through several form rewrites.

**How to apply:**
- Treat any date read from Firestore as `unknown`. Normalise it before you
  compare, sort, or call string methods on it — `toDateKey()` in
  `src/hooks/use-notifications.tsx` handles string / Timestamp / Date / ISO.
- The same caution applies to numbers (`balance` shows up as `"2500"`); coerce
  with `toNumber()` rather than trusting the declared type.
- A `string` in a Firestore doc interface is a *hope*, not a guarantee. Don't let
  a clean `tsc` run stand in for runtime safety on data you didn't write.

## `data-[disabled]:` is wrong for cmdk — it greys out and blocks *every* item

**What happened:** Every row in the command palette rendered at 50% opacity and
ignored mouse clicks. It looked like a styling bug; it was also a functional one.

**Root cause:** shadcn's `CommandItem` ships with
`data-[disabled]:pointer-events-none data-[disabled]:opacity-50`. Tailwind
compiles that to the *attribute-presence* selector `[data-disabled]`. cmdk 1.1.1
renders `"data-disabled": !!disabled` — a boolean — so React writes
`data-disabled="false"` on enabled items. The attribute is always present, so the
rule always matched.

**Why the Radix components nearby are fine:** Radix emits
`"data-disabled": disabled ? "" : void 0`, so the attribute is *omitted* when
enabled and the presence selector is correct. Don't "fix" dropdown-menu.tsx,
menubar.tsx or select.tsx to match — they are already right.

**How to apply:**
- For cmdk, always match the value: `data-[disabled=true]:`.
- More generally: before using a `data-[attr]:` presence selector, check how the
  underlying library emits the attribute. `false` and `""` are both truthy as
  *attributes*; only `undefined` removes them.
- Symptom to recognise: a whole list looks uniformly faded and unclickable, but
  keyboard navigation still works (`pointer-events-none` doesn't affect keys).

## Duplicate `react-dismissable-layer` copies freeze the page after a dialog closes

**What happened:** Opening the header's avatar menu → "Log out" → **Cancel** left
the whole dashboard inert: visible, but nothing clickable. Same as the earlier
logout-navigation leak, but triggered by *cancelling*, with no navigation at all.

**Root cause (deeper than the earlier entry):** `react-dismissable-layer` keeps
the body's pre-lock `pointer-events` value in a **module-level** variable:

```js
mount:   if (size === 0) { original = body.style.pointerEvents; body.style.pointerEvents = 'none' }
unmount: if (size === 1) { body.style.pointerEvents = original }
```

That is correct only while every layer shares one copy of the module. This repo
has **two**: `@radix-ui/react-menu/node_modules/@radix-ui/react-dismissable-layer`
and `@radix-ui/react-alert-dialog/node_modules/@radix-ui/react-dismissable-layer`.
So the menu locks the body, the dialog then mounts and records `'none'` as the
"original", and on Cancel restores `'none'` — permanently.

**How to apply:**
- Never open a Dialog/AlertDialog from inside a *modal* DropdownMenu here. The
  shared `DropdownMenu` wrapper now defaults to `modal={false}`, which prevents
  the body lock ever being set by a menu. Don't pass `modal` to undo that
  without re-reading this.
- Before blaming component code for a "page looks fine but I can't click"
  symptom, run
  `find node_modules -path "*react-dismissable-layer/package.json"`. More than
  one hit means overlapping Radix layers can corrupt each other's saved state.
- The durable fix is deduping the dependency (an `overrides` entry pinning one
  version, then `npm install`) — that is a lockfile change, so ask first.
- `releaseUiLock()` remains the escape hatch for the navigation case; it does not
  help here, because the stale lock is re-applied by the dialog's own cleanup.
