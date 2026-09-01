
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
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

export default function ClassTimetablePage() {
  useAuth();
  const { currentBranch } = useBranch();

  const { data: allClasses, loading: classesLoading } = useFirestoreCollection<any>("classes", currentBranch);
  const { data: allSubjects } = useFirestoreCollection<any>("subjects", currentBranch);
  const { data: allStaff } = useFirestoreCollection<any>("staff", currentBranch);
  const { data: allEntries, loading: ttLoading } = useFirestoreCollection<TimetableEntry>("timetable", currentBranch);

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ day: string; slot: string } | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  // Form state for new slot
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

  const handleAddSlot = (day: TimetableEntry["day"], slot: string) => {
    setEditingSlot({ day, slot });
    setSlotSubjectId("");
    setSlotTeacherId("");
    setSlotMode("Offline");
    setIsAddModalOpen(true);
  };

  const handleSaveSlot = async () => {
    if (!slotSubjectId || !slotTeacherId) {
      toast({ variant: "destructive", title: "Required", description: "Please select subject and faculty." });
      return;
    }
    setSaving(true);
    try {
      const subject = allSubjects.find((s: any) => s.id === slotSubjectId);
      const teacher = allStaff.find((s: any) => s.id === slotTeacherId);
      await addDocument("timetable", {
        classId: selectedClassId,
        day: editingSlot!.day,
        timeSlot: editingSlot!.slot,
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
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print Timetable
            </Button>
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
                  {TIME_SLOTS.map((slot) => (
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Schedule Slot</DialogTitle>
              <DialogDescription>
                {editingSlot?.day}, {editingSlot?.slot}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Subject *</Label>
                <Select value={slotSubjectId} onValueChange={setSlotSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSubjects.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
