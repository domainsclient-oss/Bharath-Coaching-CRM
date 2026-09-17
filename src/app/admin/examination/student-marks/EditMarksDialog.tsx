"use client";

import { useState } from "react";
import { doc, writeBatch } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { db } from "@/config/firebase";
import { toast } from "@/hooks/use-toast";
import { GradeBadge, MarkListRow, formatDate, subjectGrade } from "./markList";

interface Draft {
  absent: boolean;
  mark: string;
}

function draftError(d: Draft, maxMarks: number): string | null {
  if (d.absent) return null;
  if (d.mark.trim() === "") return "Required";
  const n = Number(d.mark);
  if (!Number.isFinite(n) || n < 0) return "Invalid";
  if (n > maxMarks) return `Max ${maxMarks}`;
  return null;
}

// Mounted fresh for each row (keyed by the caller), so the drafts start from
// the row's saved marks.
export default function EditMarksDialog({ row, onClose }: { row: MarkListRow; onClose: () => void }) {
  const subjects = row.exam.subjects;
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(subjects.map(s => [s.id, {
      absent: s.result === "Absent",
      mark: s.result === "Absent" ? "" : String(s.marksObtained),
    }])),
  );
  const [saving, setSaving] = useState(false);

  const setDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const hasErrors = subjects.some(s => draftError(drafts[s.id], s.maxMarks));

  const save = async () => {
    if (hasErrors) return;
    const changed = subjects.filter(s => {
      const d = drafts[s.id];
      const wasAbsent = s.result === "Absent";
      return d.absent !== wasAbsent || (!d.absent && Number(d.mark) !== s.marksObtained);
    });
    if (changed.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);
      changed.forEach(s => {
        const d = drafts[s.id];
        const marks = d.absent ? 0 : Number(d.mark);
        batch.update(doc(db, "marks", s.id), {
          status:        d.absent ? "Absent" : "Present",
          marksObtained: marks,
          grade:         d.absent ? null : subjectGrade(marks, s.passMarks, s.maxMarks),
        });
      });
      await batch.commit();
      toast({
        title: "Marks Updated",
        description: `${row.name}'s marks for ${row.exam.name} were saved.`,
      });
      onClose();
    } catch (err) {
      console.error("Failed to update marks:", err);
      toast({ title: "Error", description: "Could not update marks.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1E2A4A]">Edit Marks</DialogTitle>
          <DialogDescription>
            {row.name}
            {row.classNumber ? ` · Class ${row.classNumber}` : ""}
            {row.rollNo ? ` · Roll No ${row.rollNo}` : ""}
            {` · ${row.exam.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Max / Pass</TableHead>
                <TableHead className="text-center">Attendance</TableHead>
                <TableHead className="w-32">Marks Obtained</TableHead>
                <TableHead className="text-center">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map(s => {
                const d = drafts[s.id];
                const error = draftError(d, s.maxMarks);
                const grade = d.absent || error ? null : subjectGrade(Number(d.mark), s.passMarks, s.maxMarks);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.subject}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(s.date)}</TableCell>
                    <TableCell className="text-right text-sm">{s.maxMarks} / {s.passMarks}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-xs font-semibold ${d.absent ? "text-red-500" : "text-muted-foreground"}`}>A</span>
                        <Switch
                          checked={!d.absent}
                          onCheckedChange={present => setDraft(s.id, { absent: !present })}
                          disabled={saving}
                          aria-label={`${s.subject} present`}
                        />
                        <span className={`text-xs font-semibold ${!d.absent ? "text-green-600" : "text-muted-foreground"}`}>P</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={s.maxMarks}
                        value={d.mark}
                        onChange={e => setDraft(s.id, { mark: e.target.value })}
                        disabled={d.absent || saving}
                        placeholder={d.absent ? "Absent" : ""}
                        aria-invalid={!!error}
                        className={`h-8 ${error ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
                    </TableCell>
                    <TableCell className="text-center"><GradeBadge grade={grade} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2"
            onClick={save}
            disabled={saving || hasErrors}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
