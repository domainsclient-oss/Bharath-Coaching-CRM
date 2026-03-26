
'use client';

import { useState, useEffect } from 'react';
import { timetableService, batchService } from '../../../services/firestoreService';
import { useBranchData } from '../../../context/BranchContext';
import type { Timetable, TimetableEntry } from '../../../models/timetable';
import type { Batch } from '../../../models/batch';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Skeleton } from '../../../components/ui/skeleton';
import { toast } from '../../../components/ui/use-toast';

const daysOfWeek: TimetableEntry['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetablePage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { branchId } = useBranchData();

  useEffect(() => {
    if (!branchId) return;
    const fetchBatches = async () => {
      const batchList = await batchService.query([{ field: 'branchId', operator: '==', value: branchId }]);
      setBatches(batchList as Batch[]);
    };
    fetchBatches();
  }, [branchId]);

  useEffect(() => {
    if (!selectedBatchId) return;
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        setError(null);
        const tt = await timetableService.getById(selectedBatchId);
        if (tt) {
          setTimetable(tt as Timetable);
        } else {
          // Create a new blank timetable if one doesn't exist
          setTimetable({
            id: selectedBatchId,
            branchId,
            batchId: selectedBatchId,
            schedule: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Timetable);
        }
      } catch (err) {
        setError('Failed to load timetable.');
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [selectedBatchId, branchId]);

  const handleScheduleChange = (day: TimetableEntry['day'], index: number, field: keyof TimetableEntry, value: string) => {
    if (!timetable) return;
    const newSchedule = [...timetable.schedule];
    // This is a simplified update logic. A real app would need a more robust way to manage the schedule array.
    // setTimetable(prev => ({ ...prev!, schedule: newSchedule }));
  };

  const handleSaveTimetable = async () => {
    if (!timetable || !selectedBatchId) return;
    setIsSaving(true);
    try {
      await timetableService.set(selectedBatchId, timetable);
      toast({ title: 'Success', description: 'Timetable saved.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Could not save timetable.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Timetable Management</h1>
        <div className="flex items-center gap-4">
          <Select onValueChange={setSelectedBatchId} value={selectedBatchId ?? ''}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select a Batch" /></SelectTrigger>
            <SelectContent>
              {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleSaveTimetable} disabled={isSaving || !timetable}>
            {isSaving ? 'Saving...' : 'Save Timetable'}
          </Button>
        </div>
      </div>
      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
      <Card>
        <CardHeader><CardTitle>Weekly Schedule</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : timetable ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {daysOfWeek.map(day => (
                <div key={day}>
                  <h3 className="font-bold text-center mb-2">{day}</h3>
                  {/* Render timetable entries for each day */}
                  <div className="space-y-2 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-center text-gray-500">No classes scheduled.</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center p-4">Select a batch to view or create a timetable.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
