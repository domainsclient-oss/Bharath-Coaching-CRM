import MarkEntryContent from "./MarkEntryContent";

// page.tsx is a server component — no "use client"
// In Next.js 15, searchParams is a Promise and must be awaited.
export default async function MarkEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string }>;
}) {
  const params = await searchParams;
  const examId = params.examId ?? null;
  return <MarkEntryContent examId={examId} />;
}
