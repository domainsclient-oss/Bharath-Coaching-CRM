'use client';

import { useState, useEffect } from 'react';
import { attendanceService, studentService } from '@/services/firestoreService';
import { useBranch } from '@/context/BranchContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { withFeatureFlag } from '@/components/withFeatureFlag';

type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

interface StudentRecord {
  id: string;
  name: string;
  branchId: string;
}

const today = new Date().toISOString().split('T')[0];

function AttendancePage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentBranch } = useBranch();

  useEffect(() => {
    if (!currentBranch) return;
    const fetchStudents = async () => {
      try {
        const studentList = await studentService.query([{ field: 'branchId', operator: '==', value: currentBranch }]);
        setStudents(studentList as StudentRecord[]);
      } catch (err) {
        setError('Failed to load students.');
        console.error(err);
      }
    };
    fetchStudents();
  }, [currentBranch]);

  useEffect(() => {
    if (!currentBranch || !selectedDate || students.length === 0) return;

    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      const docId = `${selectedDate}_${currentBranch}`;
      try {
        const attendanceDoc = await attendanceService.getById(docId);
        if (attendanceDoc && attendanceDoc.records) {
          setAttendanceRecords(attendanceDoc.records as Record<string, AttendanceStatus>);
        } else {
          const initialRecords: Record<string, AttendanceStatus> = {};
          students.forEach(s => { initialRecords[s.id] = 'Present'; });
          setAttendanceRecords(initialRecords);
        }
      } catch (err) {
        setError('Failed to load attendance data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedDate, currentBranch, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!currentBranch || !selectedDate) return;
    setIsSaving(true);
    const docId = `${selectedDate}_${currentBranch}`;
    try {
      await attendanceService.set(docId, {
        branchId: currentBranch,
        date: selectedDate,
        records: attendanceRecords,
      });
      toast({ title: 'Success', description: `Attendance for ${selectedDate} saved.` });
    } catch (err) {
      console.error('Failed to save attendance:', err);
      toast({ title: 'Error', description: 'Could not save attendance.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Take Attendance</h1>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-48"
          />
          <Button onClick={handleSaveAttendance} disabled={isSaving || loading}>
            {isSaving ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

      <Card>
        <CardHeader><CardTitle>Student List</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              [...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-9 w-32" />
                </div>
              ))
            ) : (
              students.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="font-medium text-gray-800 dark:text-gray-200">{student.name}</p>
                  <Select
                    value={attendanceRecords[student.id] || 'Present'}
                    onValueChange={(value: AttendanceStatus) => handleStatusChange(student.id, value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Present">Present</SelectItem>
                      <SelectItem value="Absent">Absent</SelectItem>
                      <SelectItem value="Late">Late</SelectItem>
                      <SelectItem value="Excused">Excused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))
            )}
            {!loading && students.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                No students found for this branch. Add students or run the setup utility to seed demo data.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default withFeatureFlag(AttendancePage, 'attendance');
