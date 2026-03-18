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
