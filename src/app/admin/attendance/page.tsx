'use client';

import { useState, useEffect } from 'react';
import { attendanceService, studentService } from '../../../services/firestoreService';
import { useBranchData } from '../../../context/BranchContext';
import type { DailyAttendance, AttendanceStatus } from '../../../models/attendance';
import type { Student } from '../../../models/student'; // Assuming you have a student model
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Skeleton } from '../../../components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { withFeatureFlag } from '../../../components/withFeatureFlag';

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { branchId } = useBranchData();

  // Effect to fetch students for the branch
  useEffect(() => {
    if (!branchId) return;
    const fetchStudents = async () => {
      try {
        const studentList = await studentService.query([{ field: 'branchId', operator: '==', value: branchId }]);
        setStudents(studentList as Student[]);
      } catch (err) {
        setError("Failed to load students.");
        console.error(err);
      }
    };
    fetchStudents();
  }, [branchId]);

  // Effect to fetch attendance for the selected date
  useEffect(() => {
    if (!branchId || !selectedDate) return;
    
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      const docId = `${selectedDate}_${branchId}`;

      try {
        const attendanceDoc = await attendanceService.getById(docId);
        if (attendanceDoc && attendanceDoc.records) {
          setAttendanceRecords(attendanceDoc.records as Record<string, AttendanceStatus>);
        } else {
          // If no record exists, initialize with all students as 'Present'
          const initialRecords: Record<string, AttendanceStatus> = {};
          students.forEach(s => { initialRecords[s.id] = 'Present'; });
          setAttendanceRecords(initialRecords);
        }
      } catch (err) {
        setError("Failed to load attendance data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (students.length > 0) {
        fetchAttendance();
    }

  }, [selectedDate, branchId, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!branchId || !selectedDate) return;
    setIsSaving(true);
    const docId = `${selectedDate}_${branchId}`;

    const dataToSave: Omit<DailyAttendance, 'id' | 'createdAt' | 'updatedAt'> = {
      branchId,
      date: new Date(selectedDate),
      records: attendanceRecords,
    };

    try {
      await attendanceService.set(docId, dataToSave);
      toast({ title: "Success", description: `Attendance for ${selectedDate} saved.` });
    } catch (err) {
      console.error("Failed to save attendance:", err);
      toast({ title: "Error", description: "Could not save attendance.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Take Attendance</h1>
        <div className="flex items-center gap-4">
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-48" />
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
                 {!loading && students.length === 0 && <p>No students found for this branch.</p>}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

// A placeholder student type. This should ideally be in `src/models/student.ts`
export type Student = {
    id: string;
    name: string;
    branchId: string;
}

export default withFeatureFlag(AttendancePage, 'attendance');
