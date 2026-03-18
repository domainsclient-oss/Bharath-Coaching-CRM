# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bharath Academy — a white-labeled educational institution CRM built with Next.js 15 (App Router), Firebase, and TypeScript. Supports multi-branch operations with role-based access control.

## Commands

```bash
npm run dev          # Start dev server on port 9002 (Turbopack)
npm run build        # Production build (NODE_ENV=production)
npm run lint         # ESLint
npm run typecheck    # TypeScript check (tsc --noEmit)
npm run deploy       # Build + firebase deploy --only hosting
```

No test runner is configured in this project.

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **UI Components**: Radix UI primitives + shadcn/ui pattern (`src/components/ui/`)
- **Forms**: react-hook-form + Zod
- **Charts**: Recharts
- **AI**: Google Genkit (partial, in `src/ai/`)

### Route Structure
```
/login               → Authentication
/admin/*             → Admin CRM (38 pages, role-gated)
/student/*           → Student portal (9 pages)
/                    → Redirects based on user role
```

### Role-Based Access
Four roles: `super_admin`, `admin`, `teacher`, `student`
- Protected via `RoleBasedAccess` component wrapper
- Feature flags via `withFeatureFlag` HOC
- Firestore security rules in `firestore.rules`

### Data Layer (`src/services/firestoreService.ts`)
Generic CRUD functions (`addDocument`, `getDocuments`, `updateDocument`, `deleteDocument`) with query builder. Domain-specific service factories (studentService, staffService, feeService, etc.) are built on top. Real-time subscriptions use Firestore `onSnapshot()`.

### Key Providers (composed in `src/app/layout.tsx`)
- `AuthProvider` (`src/lib/auth-context.tsx`) — Firebase Auth + Firestore user documents
- `BranchProvider` (`src/context/`) — Active branch state (Trichy, Chennai, Coimbatore, Madurai)
- `ThemeProvider` — Light/dark mode

### Configuration
- `src/config/centerConfig.ts` — Center branding and 26 feature flags
- `src/config/firebase.ts` — Firebase initialization (exports `db`, `auth`, `storage`)
- All branding and Firebase credentials come from `.env` — see `.env.example` for required vars

### Path Alias
`@/*` maps to `./src/*` (configured in `tsconfig.json`)

## Environment Variables

Required `NEXT_PUBLIC_FIREBASE_*` vars: `API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`

Feature toggles via `NEXT_PUBLIC_FEATURE_*`: `ATTENDANCE`, `FEES`, `EXPENSES`, `REPORTS`, `STAFF`, `SMS`, `PAYMENT`, `PARENT_PORTAL`, `TIMETABLE`, `EXAMS`

Theme customization via `NEXT_PUBLIC_THEME_*` HSL color vars.

## Key Files Reference
- `bharath-build.md` — Master build plan with detailed specs for all 47 pages
- `DEPLOYMENT_GUIDE.md` — Step-by-step Firebase deployment for new clients
- `firestore.rules` — Firestore security rules (role-based)
- `firestore.indexes.json` — Required DB indexes
- `next.config.ts` — TypeScript/ESLint build errors are suppressed; remote images allowed from placehold.co, unsplash, picsum

---

## Behavioral Rules

### 1. Plan First Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately – don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes – don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests – then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
