// .idx/airules.md  (or .aicontext in project root)

# Bharath Academy CRM — Project Context

## Stack
- Next.js 14+ App Router, TypeScript, Tailwind CSS
- Firebase Firestore for data, Firebase Auth for authentication
- Navy #1E2A4A / Teal #0D7C8F design system (HSL variables in globals.css)
- lucide-react icons, recharts for charts

## What is built
- AuthProvider in src/app/layout.tsx
- BranchContext with Trichy as default branch
- AdminLayout with sidebar and header
- StudentLayout for student portal
- 27+ placeholder routes established
- Role system: super_admin, admin, teacher, student

## How to work
- Build plan is in BUILD_PLAN.md in the project root
- Build one page at a time — wait for approval before next
- Every data record must include branchId
- Use useBranchData() hook to filter all queries
- Use Firestore for all data (not localStorage/mock arrays)
- Follow existing Navy/Teal design tokens exactly