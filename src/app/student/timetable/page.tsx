"use client";

import { useEffect, useState } from "react";
import { queryDocuments } from "@/services/firestoreService";
import { useStudentRecord } from "@/hooks/useStudentRecord";
import { DAY_KEYS, DAY_LABELS, dayKey } from "@/lib/timetableDay";
import { slotStartMinutes } from "@/lib/timeSlot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * The admin class-timetable screen writes one `timetable` document per slot,
 * keyed by the `classes` document id rather than by the bare class number.
 */
interface TimetableSlot {
  id: string;
  classId: string;
  day: string;
  timeSlot: string;
  subjectName?: string;
  teacherName?: string;
  mode?: string;
}

/**
 * Sorts slots by the hour they actually start.
 *
 * The stored label is a display string ("4:00-5:00 PM"), so comparing the text
 * would file the afternoon before the morning. `slotStartMinutes` reads the
 * label back into a real time first.
 */
const byStartTime = (a: TimetableSlot, b: TimetableSlot) =>
  slotStartMinutes(String(a.timeSlot ?? "")) - slotStartMinutes(String(b.timeSlot ?? ""));

const TimetablePage = () => {
  const { classId, className, loading: recordLoading, unlinked } = useStudentRecord();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recordLoading) return;

    if (!classId) {
      setSlots([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const rows = await queryDocuments<TimetableSlot>("timetable", [
          { field: "classId", operator: "==", value: classId },
        ]);
        setSlots(rows as TimetableSlot[]);
      } catch (err) {
        console.error("Failed to load timetable:", err);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [classId, recordLoading]);

  // The admin screen writes the day short ("Mon") while the heading here spells
  // it out, so both sides go through the shared key. Comparing the two
  // spellings directly is what used to hide a published timetable.
  const days = DAY_KEYS
    .map(key => ({
      key,
      day: DAY_LABELS[key],
      schedule: slots.filter(s => dayKey(s.day) === key).sort(byStartTime),
    }))
    .filter(d => d.schedule.length > 0);

  const busy = loading || recordLoading;

  const DayCard = ({ day, schedule }: { day: string; schedule: TimetableSlot[] }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{day}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Time</TableHead>
              <TableHead>Subject</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map(slot => (
              <TableRow key={slot.id}>
                <TableCell className="font-mono text-sm">{slot.timeSlot}</TableCell>
                <TableCell className="font-medium">
                  {slot.subjectName || "-"}
                  {slot.teacherName && <div className="text-xs text-muted-foreground">{slot.teacherName}</div>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Weekly Class Timetable</h1>
        <p className="text-muted-foreground">
          {className ? `Your schedule for Class ${className}.` : "Your weekly schedule."}
        </p>
      </div>

      {busy ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : unlinked ? (
        <Card><CardContent className="pt-6">
          <p className="text-muted-foreground">
            Your login is not linked to a student record yet. Please contact your branch office.
          </p>
        </CardContent></Card>
      ) : days.length === 0 ? (
        <Card><CardContent className="pt-6">
          <p className="text-muted-foreground">
            No timetable has been published for your class yet.
          </p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {days.map(d => <DayCard key={d.key} day={d.day} schedule={d.schedule} />)}
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
