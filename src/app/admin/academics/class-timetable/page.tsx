
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  ChevronRight,
  Printer,
  Clock,
  MoreVertical,
  Calendar,
  Video,
  MapPin,
  Trash2,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { TIME_SLOTS, DAYS, TimetableEntry } from "@/data/academicsData";
import { formatSlot, joinTime, parseSlot, slotStartMinutes, splitTime } from "@/lib/timeSlot";
// Spelled out in the picker; the grid keeps the short form it is sized for.
// Shared with the student portal so both read one day key.
import { DAY_LABELS } from "@/lib/timetableDay";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

/** Fallback when a stored label cannot be read back into two times. */
const DEFAULT_TIMES = { start: "10:00", end: "11:00" };

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

/**
 * Hour, minute and AM/PM as three plain dropdowns.
 *
 * A native <input type="time"> only shows an AM/PM box in locales whose
 * browser chrome is 12-hour, so on a 24-hour machine there was no way to say
 * afternoon. Choosing the meridiem outright removes that guesswork. The value
 * stays a 24-hour "HH:MM" string, so nothing downstream changes.
 */
const TimeField = ({
  id, label, value, onChange,
}: { id: string; label: string; value: string; onChange: (next: string) => void }) => {
  const parts = splitTime(value) ?? { hour: 12, minute: 0, meridiem: "AM" as const };
  const set = (patch: Partial<typeof parts>) => onChange(joinTime({ ...parts, ...patch }));

  // A stored time off the five-minute grid must still be selectable, or
  // opening an existing slot would silently round it.
  const minutes = MINUTE_STEPS.includes(parts.minute)
    ? MINUTE_STEPS
    : [...MINUTE_STEPS, parts.minute].sort((a, b) => a - b);

  return (
    <div className="grid gap-2">
      <Label htmlFor={`${id}-hour`}>{label}</Label>
      <div className="flex items-center gap-1.5">
        <Select value={String(parts.hour)} onValueChange={(v) => set({ hour: Number(v) })}>
          <SelectTrigger id={`${id}-hour`} className="w-[74px]" aria-label={`${label} hour`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => <SelectItem key={h} value={String(h)}>{h}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="font-bold text-muted-foreground">:</span>
        <Select value={String(parts.minute)} onValueChange={(v) => set({ minute: Number(v) })}>
          <SelectTrigger className="w-[74px]" aria-label={`${label} minute`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((m) => (
              <SelectItem key={m} value={String(m)}>{String(m).padStart(2, "0")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={parts.meridiem}
          onValueChange={(v) => set({ meridiem: v as "AM" | "PM" })}
        >
          <SelectTrigger className="w-[84px]" aria-label={`${label} AM or PM`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default function ClassTimetablePage() {
  useAuth();
  const { currentBranch } = useBranch();

  const { data: allClasses, loading: classesLoading } = useFirestoreCollection<any>("classes", currentBranch);
  const { data: allSubjects, loading: subjectsLoading } = useFirestoreCollection<any>("subjects", currentBranch);
  const { data: allStaff } = useFirestoreCollection<any>("staff", currentBranch);
  const { data: allEntries, loading: ttLoading } = useFirestoreCollection<TimetableEntry>("timetable", currentBranch);

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  // Form state for new slot. Day and time are pickable, so they live here
  // rather than being fixed by whichever cell was clicked.
  const [slotDay, setSlotDay] = useState<TimetableEntry["day"]>(DAYS[0]);
  const [slotStart, setSlotStart] = useState(DEFAULT_TIMES.start);
  const [slotEnd, setSlotEnd] = useState(DEFAULT_TIMES.end);
  const [slotSubjectId, setSlotSubjectId] = useState("");
  const [slotTeacherId, setSlotTeacherId] = useState("");
  const [slotMode, setSlotMode] = useState<"Offline" | "Online">("Offline");
  const [saving, setSaving] = useState(false);

  // Auto-select first class when classes load
  useEffect(() => {
    if (!selectedClassId && allClasses.length > 0) {
      setSelectedClassId(allClasses[0].id);
    }
  }, [allClasses, selectedClassId]);

  const selectedClass = useMemo(
    () => allClasses.find((c) => c.id === selectedClassId),
    [allClasses, selectedClassId]
  );

  const timetableData = useMemo(
    () => allEntries.filter((t) => t.classId === selectedClassId),
    [allEntries, selectedClassId]
  );

  /**
   * Subjects offered for the selected class, picked up from Subject Management
   * as they are saved. A subject that was never linked to a class would
   * otherwise be unreachable, so when this class has no linked subjects the
   * whole branch list is offered rather than an empty dropdown.
   */
  const subjectOptions = useMemo(() => {
    const byName = (a: any, b: any) => String(a.name ?? "").localeCompare(String(b.name ?? ""));
    const linked = allSubjects.filter((s: any) =>
      Array.isArray(s.classIds) && s.classIds.includes(selectedClassId)
    );
    return (linked.length > 0 ? linked : allSubjects).slice().sort(byName);
  }, [allSubjects, selectedClassId]);

  const handleAddSlot = (day: TimetableEntry["day"], slot: string) => {
    const times = parseSlot(slot) ?? DEFAULT_TIMES;
    setSlotDay(day);
    setSlotStart(times.start);
    setSlotEnd(times.end);
    setSlotSubjectId("");
    setSlotTeacherId("");
    setSlotMode("Offline");
    setIsAddModalOpen(true);
  };

  const handleSaveSlot = async () => {
    if (!selectedClassId) {
      toast({ variant: "destructive", title: "Required", description: "Choose a class first." });
      return;
    }
    if (!slotSubjectId || !slotTeacherId) {
      toast({ variant: "destructive", title: "Required", description: "Please select subject and faculty." });
      return;
    }
    const timeSlot = formatSlot(slotStart, slotEnd);
    if (!timeSlot) {
      toast({ variant: "destructive", title: "Check the time", description: "The end time must be later than the start time." });
      return;
    }
    const taken = timetableData.find((e) => e.day === slotDay && e.timeSlot === timeSlot);
    if (taken) {
      toast({
        variant: "destructive",
        title: "Slot already booked",
        description: `${DAY_LABELS[slotDay]} ${timeSlot} is taken by ${taken.subjectName}. Remove it first.`,
      });
      return;
    }
    setSaving(true);
    try {
      const subject = allSubjects.find((s: any) => s.id === slotSubjectId);
      const teacher = allStaff.find((s: any) => s.id === slotTeacherId);
      await addDocument("timetable", {
        classId: selectedClassId,
        day: slotDay,
        timeSlot,
        subjectId: slotSubjectId,
        subjectName: subject?.name ?? slotSubjectId,
        teacherId: slotTeacherId,
        teacherName: teacher?.name ?? slotTeacherId,
        mode: slotMode,
        branchId: currentBranch,
      });
      toast({ title: "Slot Added", description: "Timetable updated successfully." });
      setIsAddModalOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not save slot." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!deleteEntryId) return;
    try {
      await deleteDocument("timetable", deleteEntryId);
      toast({ title: "Slot Removed" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not remove slot." });
    } finally {
      setDeleteEntryId(null);
    }
  };

  // Rows are the seeded slots plus any this class actually uses, in clock
  // order. Without this a slot picked outside the presets would be saved and
  // then have no row to appear in.
  const visibleSlots = useMemo(() => {
    const slots = new Set<string>(TIME_SLOTS);
    timetableData.forEach((e) => { if (e.timeSlot) slots.add(e.timeSlot); });
    return [...slots].sort((a, b) => slotStartMinutes(a) - slotStartMinutes(b) || a.localeCompare(b));
  }, [timetableData]);

  const loading = classesLoading || ttLoading;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Class Timetable" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden print:p-0 print:bg-white">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-1 mb-2 print:hidden">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/academics/classes" className="hover:text-[#0D7C8F]">Academics</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Class Timetable</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Weekly Schedule</h2>
            <div className="flex items-center gap-2">
              <Button
                className="gap-2 bg-[#0D7C8F] hover:bg-[#0D7C8F]/90"
                disabled={!selectedClassId}
                onClick={() => handleAddSlot(DAYS[0], TIME_SLOTS[0])}
              >
                <Plus className="h-4 w-4" /> Add Slot
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print Timetable
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm print:hidden">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="grid gap-2 flex-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Select Class</Label>
                {classesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Choose Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {allClasses.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.board ? `(${c.board})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timetable Grid */}
        {loading ? (
          <Skeleton className="h-96 w-full" />
        ) : allClasses.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="py-16 text-center text-muted-foreground">
              No classes found. Add classes in <Link href="/admin/academics/classes" className="text-[#0D7C8F] underline">Academics → Classes</Link> first.
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-sm overflow-hidden print:shadow-none print:border">
            <div className="bg-[#1E2A4A] text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-[#0D7C8F]" />
                <h3 className="font-bold">{selectedClass?.name ?? "—"} — Weekly Schedule</h3>
              </div>
              {selectedClass?.board && (
                <Badge className="bg-white/20 text-white border-white/30">{selectedClass.board}</Badge>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border p-3 text-xs font-bold text-muted-foreground uppercase w-32">Time Slot</th>
                    {DAYS.map((day) => (
                      <th key={day} className="border p-3 text-xs font-bold text-[#1E2A4A] uppercase w-40">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleSlots.map((slot) => (
                    <tr key={slot} className="group">
                      <td className="border p-3 text-center bg-slate-50/50">
                        <div className="flex flex-col items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-slate-600">{slot}</span>
                        </div>
                      </td>
                      {DAYS.map((day) => {
                        const entry = timetableData.find((e) => e.day === day && e.timeSlot === slot);
                        return (
                          <td key={`${day}-${slot}`} className="border p-2 group/cell h-24">
                            {entry ? (
                              <div className="relative h-full flex flex-col justify-between p-2 rounded-lg bg-white shadow-sm border border-slate-100 group-hover/cell:border-[#0D7C8F]/30 transition-all">
                                <div className="flex justify-between items-start">
                                  <Badge variant="secondary" className="text-[9px] font-bold bg-[#1E2A4A]/5 text-[#1E2A4A] px-1.5 py-0 border-none">
                                    {entry.subjectName}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 rounded-full opacity-0 group-hover/cell:opacity-100 text-red-500 print:hidden"
                                    onClick={() => setDeleteEntryId(entry.id!)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-medium text-slate-500 truncate">{entry.teacherName}</p>
                                  <div className="flex items-center gap-1">
                                    {entry.mode === "Online" ? (
                                      <Badge className="bg-[#0D7C8F] text-[8px] h-3.5 px-1 flex items-center gap-0.5">
                                        <Video className="h-2 w-2" /> Online
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-[#1E2A4A] text-[8px] h-3.5 px-1 flex items-center gap-0.5">
                                        <MapPin className="h-2 w-2" /> Offline
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddSlot(day, slot)}
                                className="w-full h-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:text-[#0D7C8F] hover:border-[#0D7C8F] transition-all print:hidden"
                              >
                                <Plus className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Confirm Delete Dialog */}
        <Dialog open={!!deleteEntryId} onOpenChange={(open) => { if (!open) setDeleteEntryId(null); }}>
          <DialogContent className="sm:max-w-[360px]">
            <DialogHeader>
              <DialogTitle>Remove Slot</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this timetable slot? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteEntryId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteSlot}>Remove</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Slot Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Schedule Slot</DialogTitle>
              <DialogDescription>
                {DAY_LABELS[slotDay]}, {formatSlot(slotStart, slotEnd) ?? "set a valid time"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Day *</Label>
                <Select value={slotDay} onValueChange={(v) => setSlotDay(v as TimetableEntry["day"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d} value={d}>{DAY_LABELS[d]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TimeField id="slot-from" label="From *" value={slotStart} onChange={setSlotStart} />
              <TimeField id="slot-to" label="To *" value={slotEnd} onChange={setSlotEnd} />
              <div className="grid gap-2">
                <Label>Subject *</Label>
                {subjectsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : subjectOptions.length === 0 ? (
                  <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    No subjects yet.{" "}
                    <Link href="/admin/academics/subjects" className="font-medium text-[#0D7C8F] hover:underline">
                      Add subjects
                    </Link>{" "}
                    to fill this list.
                  </p>
                ) : (
                  <Select value={slotSubjectId} onValueChange={setSlotSubjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}{s.type && s.type !== "Theory" ? ` (${s.type})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Faculty *</Label>
                <Select value={slotTeacherId} onValueChange={setSlotTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {allStaff.filter((s: any) => s.role === "Teacher").map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Delivery Mode</Label>
                <RadioGroup
                  value={slotMode}
                  onValueChange={(v) => setSlotMode(v as "Offline" | "Online")}
                  className="flex gap-4 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Offline" id="m-offline" />
                    <Label htmlFor="m-offline" className="cursor-pointer">Offline</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Online" id="m-online" />
                    <Label htmlFor="m-online" className="cursor-pointer">Online</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                className="bg-[#0D7C8F] w-full"
                onClick={handleSaveSlot}
                disabled={saving}
              >
                {saving ? "Saving..." : "Update Timetable"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <style jsx global>{`
        @media print {
          body { background-color: white !important; }
          aside, header, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .overflow-x-auto { overflow: visible !important; }
        }
      `}</style>
    </div>
  );
}
