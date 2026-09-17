"use client";

import { BookOpen, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useSettings } from "@/context/SettingsContext";
import {
  GradeBadge, MarkListRow, ResultBadge, dateRange, formatDate,
} from "./markList";

const PRINT_CLASS = "student-marks-printing";
const PRINT_TARGET = "student-marks-print-target";

// Print the open mark list on its own. The rules only apply while the body
// carries PRINT_CLASS, so they never affect printing anywhere else in the app.
// The dialog is fixed and centred on screen; in print it is pinned to the top
// of the page and allowed to run across as many pages as it needs.
const PRINT_CSS = `
@media print {
  body.${PRINT_CLASS} * { visibility: hidden; }
  body.${PRINT_CLASS} .${PRINT_TARGET}, body.${PRINT_CLASS} .${PRINT_TARGET} * { visibility: visible; }
  body.${PRINT_CLASS} .${PRINT_TARGET} {
    position: absolute !important; left: 0 !important; top: 0 !important;
    transform: none !important; width: 100% !important; max-width: none !important;
    max-height: none !important; overflow: visible !important;
    border: none !important; box-shadow: none !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
}`;

function printMarkList() {
  const target = document.getElementById("mark-list-detail");
  if (!target) return;
  target.classList.add(PRINT_TARGET);
  document.body.classList.add(PRINT_CLASS);
  const cleanup = () => {
    target.classList.remove(PRINT_TARGET);
    document.body.classList.remove(PRINT_CLASS);
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}

export default function MarkListDialog({ row, onClose }: { row: MarkListRow | null; onClose: () => void }) {
  const { settings } = useSettings();
  const exam = row?.exam;

  return (
    <Dialog open={!!row} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent
        id="mark-list-detail"
        className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white [&>button]:text-white print:[&>button]:hidden"
      >
        <style>{PRINT_CSS}</style>
        {row && exam && (
          <>
            {/* Header */}
            <div className="bg-[#1E2A4A] text-white p-6 text-center space-y-1">
              <div className="flex items-center justify-center gap-3 mb-2">
                <BookOpen className="h-8 w-8 text-blue-300" />
                <div className="text-left">
                  <p className="text-xl font-bold">{settings.appName}</p>
                  <p className="text-xs text-blue-200">{settings.address}</p>
                </div>
              </div>
              <div className="border-t border-blue-700 pt-3">
                <DialogTitle className="text-sm font-semibold tracking-wide text-blue-100">
                  STUDENT MARK LIST
                </DialogTitle>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Student info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 rounded-lg p-4">
                {[
                  { label: "Student Name", value: row.name },
                  { label: "Class", value: row.classNumber ? `Class ${row.classNumber}` : "—" },
                  { label: "Roll No", value: row.rollNo || "—" },
                  { label: "Exam Date", value: dateRange(exam.subjects) },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-semibold text-sm text-[#1E2A4A]">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5">
                  <p className="text-xs text-muted-foreground">Exam Name</p>
                  <p className="font-bold text-[#1E2A4A]">{exam.name}</p>
                </div>

                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Max Marks</TableHead>
                      <TableHead className="text-right">Pass Marks</TableHead>
                      <TableHead className="text-right">Marks Obtained</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exam.subjects.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.subject}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(sub.date)}</TableCell>
                        <TableCell className="text-right">{sub.maxMarks}</TableCell>
                        <TableCell className="text-right">{sub.passMarks}</TableCell>
                        <TableCell className="text-right font-bold text-[#1E2A4A]">
                          {sub.result === "Absent" ? "—" : sub.marksObtained}
                        </TableCell>
                        <TableCell className="text-center"><GradeBadge grade={sub.grade} /></TableCell>
                        <TableCell className="text-center"><ResultBadge result={sub.result} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="bg-slate-50">
                    <TableRow>
                      <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                      <TableCell className="text-right font-semibold">{exam.totalMax}</TableCell>
                      <TableCell />
                      <TableCell className="text-right font-bold text-[#1E2A4A]">{exam.totalObtained}</TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </TableFooter>
                </Table>

                {/* Exam summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Marks</p>
                    <p className="font-bold text-sm text-[#1E2A4A]">{exam.totalObtained} / {exam.totalMax}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Percentage</p>
                    <p className="font-bold text-sm text-[#1E2A4A]">{exam.percentage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Overall Grade</p>
                    <GradeBadge grade={exam.grade} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Overall Result</p>
                    <ResultBadge result={exam.result} />
                  </div>
                </div>
              </div>

              {/* Grade key, so parents can read the grades */}
              <div className="text-xs text-muted-foreground bg-slate-50 rounded-lg px-4 py-3">
                <span className="font-semibold text-foreground">Grade Scale: </span>
                A+ (90–100%) · A (80–89%) · B+ (70–79%) · B (60–69%) · C+ (50–59%) · C (40–49%) · D (below 40%) · F (below pass marks)
              </div>

              {/* Footer */}
              <div className="grid grid-cols-2 gap-8 pt-10 text-xs text-muted-foreground">
                <div className="border-t pt-2 text-center">Class Teacher</div>
                <div className="border-t pt-2 text-center">Parent / Guardian</div>
              </div>
              <div className="text-center text-xs text-muted-foreground border-t pt-4">
                <p>{settings.appName} — {settings.address}</p>
                <p>Phone: {settings.contactPhone} | Email: {settings.contactEmail}</p>
              </div>
            </div>

            <div className="bg-slate-50 border-t px-6 py-3 flex justify-end print:hidden">
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={printMarkList}>
                <Printer className="h-4 w-4" /> Print Mark List
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
