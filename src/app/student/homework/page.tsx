'use client';

import { useState, useEffect } from 'react';
import { queryDocuments, studentHomeworkService } from '../../../services/firestoreService';
import { useStudentRecord, normalizeClassName } from '@/hooks/useStudentRecord';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { Skeleton } from '../../../components/ui/skeleton';
import { BookOpen } from 'lucide-react';

/**
 * Homework is assigned to a whole class by the admin screen, into `homework`.
 * Whether a given student has ticked an item off is theirs alone, and lives in
 * `studentHomework/{studentId}`.
 */
interface HomeworkItem {
  id: string;
  title: string;
  subject?: string;
  className?: string;
  teacher?: string;
  assignedDate?: string;
  dueDate?: string;
  description?: string;
}

export default function HomeworkPage() {
  const { studentId, className, branchId, loading: recordLoading, unlinked } = useStudentRecord();
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [completed, setCompleted] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recordLoading) return;

    if (unlinked || !studentId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [assigned, progress] = await Promise.all([
          branchId
            ? queryDocuments<HomeworkItem>('homework', [{ field: 'branchId', operator: '==', value: branchId }])
            : Promise.resolve([]),
          studentHomeworkService.getById(studentId).catch(() => null),
        ]);

        // The class is matched after fetching: admins type it as "10" or
        // "Class 10" depending on the screen, so compare the normalised form.
        const mine = (assigned as HomeworkItem[]).filter(
          hw => !hw.className || normalizeClassName(hw.className) === className
        );
        mine.sort((a, b) => String(b.dueDate ?? '').localeCompare(String(a.dueDate ?? '')));

        setItems(mine);
        if (progress && (progress as any).data) {
          setCompleted((progress as any).data as { [key: string]: boolean });
        }
      } catch (err) {
        console.error('Failed to load homework:', err);
        setError('Failed to load your homework. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [studentId, className, branchId, recordLoading, unlinked]);

  const toggleCompletion = async (hwId: string) => {
    if (!studentId) return;

    const previous = completed;
    const newCompleted = { ...completed, [hwId]: !completed[hwId] };
    setCompleted(newCompleted);

    try {
      await studentHomeworkService.set(studentId, { studentId, data: newCompleted } as any);
    } catch (err) {
      console.error('Failed to save completion status:', err);
      setError('Could not save your changes. Please check your connection.');
      setCompleted(previous);
    }
  };

  const busy = loading || recordLoading;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1E2A4A]">My Homework</h1>
        <p className="text-muted-foreground">Tick items off as you finish them.</p>
      </div>

      {unlinked && !busy && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl">
          Your login is not linked to a student record yet. Please contact your branch office.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">{error}</div>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#1E2A4A]">
            Assignments{className ? ` — Class ${className}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {busy ? (
            <ul className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <li key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">No homework has been assigned to your class yet.</p>
          ) : (
            <ul className="space-y-4">
              {items.map(hw => (
                <li
                  key={hw.id}
                  className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  <Checkbox
                    id={`hw-${hw.id}`}
                    checked={completed[hw.id] || false}
                    onCheckedChange={() => toggleCompletion(hw.id)}
                    className="mt-0.5 h-5 w-5"
                  />
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-[#E8A020]/10 flex items-center justify-center text-[#E8A020]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <label htmlFor={`hw-${hw.id}`} className="flex-1 cursor-pointer">
                    <p className={`text-sm font-bold ${completed[hw.id] ? 'line-through text-muted-foreground' : 'text-[#1E2A4A]'}`}>
                      {hw.subject ? `${hw.subject}: ` : ''}{hw.title}
                    </p>
                    {hw.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{hw.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {hw.dueDate ? `Due ${hw.dueDate}` : 'No due date'}
                      {hw.teacher ? ` · ${hw.teacher}` : ''}
                    </p>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
