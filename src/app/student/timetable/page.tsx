
"use client";

import { mockTimetableData, DailySchedule } from "@/data/timetableData";
import { mockStudentProfile } from "@/data/studentPortalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const TimetablePage = () => {
    // In a real app, this would be fetched based on the student's class.
    const studentClass = mockStudentProfile.class;
    const timetable = mockTimetableData; // Assuming this is already filtered for the class.

    const DayCard = ({ daySchedule }: { daySchedule: DailySchedule }) => (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{daySchedule.day}</CardTitle>
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
                        {daySchedule.schedule.map((slot, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-mono text-sm">{slot.time}</TableCell>
                                <TableCell className={`font-medium ${slot.subject === 'Break' ? 'text-gray-400 italic' : ''}`}>
                                    {slot.subject}
                                    {slot.teacher && <div className="text-xs text-muted-foreground">{slot.teacher}</div>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Weekly Class Timetable</h1>
                <p className="text-muted-foreground">Your schedule for Class {studentClass}.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {timetable.timetable.map(day => (
                    <DayCard key={day.day} daySchedule={day} />
                ))}
            </div>
        </div>
    );
}

export default TimetablePage;

