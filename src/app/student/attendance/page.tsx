'use client';

import { useState, useEffect } from 'react';
import { queryDocuments } from '../../../services/firestoreService';
import { useStudentRecord } from '@/hooks/useStudentRecord';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';

/**
 * Attendance is written by the admin screen one document per student per day,
 * into `studentAttendance` with a plain "YYYY-MM-DD" date string.
 */
interface AttendanceRow {
  id: string;
  date: string;
  status: string;
  className?: string;
  notes?: string;
}

const getBadge = (status?: string) => {
  switch (status) {
    case 'Present': return <Badge variant="default">Present</Badge>;
    case 'Absent': return <Badge variant="destructive">Absent</Badge>;
    case 'Late': return <Badge variant="secondary">Late</Badge>;
    case 'Excused': return <Badge>Excused</Badge>;
    case 'Holiday': return <Badge variant="outline">Holiday</Badge>;
    default: return <Badge variant="secondary">{status || 'No Record'}</Badge>;
  }
};

const CalendarGrid = ({ rows, loading }: { rows: AttendanceRow[], loading: boolean }) => {
  if (loading) {
    return <div className="grid grid-cols-7 gap-2">{[...Array(35)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground">No attendance has been marked for you yet.</p>;
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {rows.map(row => (
        <div key={row.id} className="p-2 border border-border rounded-lg flex flex-col items-center justify-center gap-1 h-24 bg-muted/40">
          <p className="text-sm font-bold text-[#1E2A4A]">{new Date(row.date).getDate() || row.date}</p>
          {getBadge(row.status)}
        </div>
      ))}
    </div>
  );
};

export default function StudentAttendancePage() {
  const { studentId, loading: recordLoading, unlinked } = useStudentRecord();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recordLoading) return;

    if (unlinked || !studentId) {
      setLoading(false);
      return;
    }

    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        const records = await queryDocuments<AttendanceRow>(
          'studentAttendance',
          [{ field: 'studentId', operator: '==', value: studentId }],
        );
        // Sorted here rather than in the query so no composite index is needed.
        const sorted = [...records].sort((a, b) => String(a.date).localeCompare(String(b.date)));
        setRows(sorted as AttendanceRow[]);
      } catch (err) {
        console.error('Failed to load attendance:', err);
        setError('Could not load your attendance history.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [studentId, recordLoading, unlinked]);

  const marked = rows.filter(r => r.status !== 'Holiday');
  const present = marked.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const percentage = marked.length > 0 ? Math.round((present / marked.length) * 100) : null;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1E2A4A]">My Attendance</h1>
        <p className="text-muted-foreground">Every day your branch has marked for you.</p>
      </div>

      {unlinked && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl">
          Your login is not linked to a student record yet. Please contact your branch office.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">{error}</div>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#1E2A4A]">Attendance Record</CardTitle>
          {!loading && percentage !== null && (
            <p className="text-sm text-muted-foreground">
              Present on {present} of {marked.length} marked days ({percentage}%).
            </p>
          )}
        </CardHeader>
        <CardContent>
          <CalendarGrid rows={rows} loading={loading || recordLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
