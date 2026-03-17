
'use client';

import { useState, useEffect } from 'react';
import { attendanceService } from '../../../services/firestoreService';
import { useAuth } from '../../../context/AuthContext';
import { useBranchData } from '../../../context/BranchContext';
import type { DailyAttendance, AttendanceStatus } from '../../../models/attendance';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';

// A basic calendar grid component (could be replaced with a library like react-day-picker)
const CalendarGrid = ({ data, loading }: { data: Record<string, AttendanceStatus>, loading: boolean }) => {
    if (loading) {
        return <div className="grid grid-cols-7 gap-2">{[...Array(35)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
    }

    // This is a simplified example. A real implementation would handle months, days of week, etc.
    const getBadge = (status?: AttendanceStatus) => {
        if (!status) return <Badge variant="secondary">No Record</Badge>;
        switch (status) {
          case 'Present': return <Badge variant="success">Present</Badge>;
          case 'Absent': return <Badge variant="destructive">Absent</Badge>;
          case 'Late': return <Badge variant="warning">Late</Badge>;
          case 'Excused': return <Badge>Excused</Badge>;
          default: return null;
        }
    }

    return (
        <div className="grid grid-cols-7 gap-2">
            {Object.entries(data).map(([date, status]) => (
                <div key={date} className="p-2 border rounded-md flex flex-col items-center justify-center h-24 bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm font-medium">{new Date(date).getDate()}</p>
                    {getBadge(status)}
                </div>
            ))}
             {Object.keys(data).length === 0 && <p>No attendance records found for this month.</p>}
        </div>
    )
}

export default function StudentAttendancePage() {
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { branchId } = useBranchData();
  const studentId = user?.id;

  useEffect(() => {
    if (!studentId || !branchId) {
      setLoading(false);
      setError("Log in and select a branch to view attendance.");
      return;
    }

    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all attendance documents for the branch
        const dailyRecords = await attendanceService.query([
          { field: 'branchId', operator: '==', value: branchId },
        ]) as DailyAttendance[];

        // Process the records to extract the student's specific status
        const studentHistory: Record<string, AttendanceStatus> = {};
        dailyRecords.forEach(doc => {
            const dateStr = new Date(doc.date.seconds * 1000).toISOString().split('T')[0];
            if (doc.records && doc.records[studentId]) {
                studentHistory[dateStr] = doc.records[studentId];
            }
        });
        
        setAttendanceData(studentHistory);

      } catch (err) {
        console.error("Failed to load attendance:", err);
        setError("Could not load your attendance history.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [studentId, branchId]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Attendance</h1>
      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Current Month Overview</CardTitle>
          {/* Add month navigation here */}
        </CardHeader>
        <CardContent>
          <CalendarGrid data={attendanceData} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
