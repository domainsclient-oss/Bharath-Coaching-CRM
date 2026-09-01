"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { ChevronRight, Search, Printer, FileText, User, BookOpen, Phone } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/context/BranchContext";
import { useSettings } from "@/context/SettingsContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { Skeleton } from "@/components/ui/skeleton";

interface Student {
  id: string;
  appNo?: string;
  rollNo?: string;
  name: string;
  class: string;
  board: string;
  mode: string;
  status: string;
  admissionDate?: string;
  school?: string;
  previousSchool?: string;
  subjects?: string[];
  dob?: string;
  gender?: string;
  email?: string;
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  address?: string;
  city?: string;
  pincode?: string;
  parentName?: string;
  phone?: string;
  whatsapp?: string;
  photo?: string;
  branchId: string;
}

export default function StudentApplicationFormPage() {
  const { currentBranch } = useBranch();
  const { settings } = useSettings();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // ── Real Firestore data ───────────────────────────────────────────────────
  const { data: allStudents, loading } = useFirestoreCollection<Student>(
    "students",
    currentBranch,
    { conditions: [{ field: "status", operator: "==", value: "Active" }] }
  );

  const students = useMemo(() =>
    allStudents.filter(s =>
      (classFilter === "All" || s.class === classFilter) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.appNo ?? "").toLowerCase().includes(search.toLowerCase()))
    ),
    [allStudents, classFilter, search]
  );

  const selected = useMemo(() =>
    allStudents.find(s => s.id === selectedId) ?? null,
    [allStudents, selectedId]
  );

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;

    // Grab all stylesheet links from the current page
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join("\n");

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Application Form — ${selected?.name ?? ""}</title>
          ${styles}
          <style>
            @media print {
              body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { font-family: sans-serif; background: white; }
          </style>
        </head>
        <body>
          ${content.outerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          <\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const field = (label: string, value?: string | null) => (
    <div className="border-b pb-2">
      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">{label}</p>
      <p className="text-sm font-medium text-[#1E2A4A] mt-0.5">{value || "—"}</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <div className="print:hidden"><SharedHeader title="Student Application Form" /></div>
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2 print:hidden">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/students" className="hover:text-[#0D7C8F]">Students</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Application Form</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A] print:hidden">Student Application Form</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — student selector (hidden on print) */}
          <div className="space-y-4 print:hidden">
            <Card className="border-none shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Search Student</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="Name or App No..."
                      value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Class</Label>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["All", "8", "9", "10", "11", "12"].map(c => (
                        <SelectItem key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Student list */}
            <Card className="border-none shadow-sm overflow-hidden">
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : students.length > 0 ? students.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors ${selectedId === s.id ? "bg-[#0D7C8F]/5 border-l-2 border-[#0D7C8F]" : ""}`}
                  >
                    <div className="h-9 w-9 rounded-full bg-[#1E2A4A]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {s.photo
                        ? <img src={s.photo} alt="" className="h-full w-full object-cover" />
                        : <User className="h-4 w-4 text-[#1E2A4A]" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1E2A4A] truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.appNo ?? s.id} · Class {s.class}</p>
                    </div>
                  </button>
                )) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {allStudents.length === 0 ? "No active students in this branch." : "No students match your search."}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right — Application Form (full width on print) */}
          <div className="lg:col-span-2 print:col-span-full">
            {!selected ? (
              <Card className="border-none shadow-sm h-64 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Select a student to view their application form</p>
                </div>
              </Card>
            ) : (
              <>
                <div className="flex justify-end mb-3 print:hidden">
                  <Button variant="outline" className="gap-2" onClick={handlePrint}>
                    <Printer className="h-4 w-4" /> Print Application
                  </Button>
                </div>

                <Card className="border shadow-md" ref={printRef}>
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="bg-[#1E2A4A] text-white p-6 rounded-t-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h1 className="text-xl font-bold">{settings.appName}</h1>
                          <p className="text-sm text-white/70 mt-0.5">{currentBranch} Branch</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/50 uppercase font-bold">Application No</p>
                          <p className="text-lg font-mono font-bold text-[#0D7C8F]">{selected.appNo}</p>
                        </div>
                      </div>
                      <p className="text-center text-sm font-bold uppercase tracking-widest mt-4 border-t border-white/20 pt-3">
                        Student Admission Application Form
                      </p>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Photo placeholder + status */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-20 w-16 border-2 border-dashed border-slate-300 rounded flex items-center justify-center bg-slate-50 flex-shrink-0">
                            {selected.photo
                              ? <img src={selected.photo} alt="" className="h-full w-full object-cover rounded" />
                              : <User className="h-8 w-8 text-slate-300" />
                            }
                          </div>
                          <div>
                            <p className="text-xl font-bold text-[#1E2A4A]">{selected.name}</p>
                            <p className="text-sm text-muted-foreground">Roll No: <span className="font-semibold text-foreground">{selected.rollNo}</span></p>
                          </div>
                        </div>
                        <Badge className={`text-xs ${selected.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {selected.status}
                        </Badge>
                      </div>

                      {/* Section 1 — Academic Details */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="h-4 w-4 text-[#0D7C8F]" />
                          <p className="text-sm font-bold text-[#1E2A4A] uppercase tracking-wide">Academic Details</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {field("Class", `Class ${selected.class}`)}
                          {field("Board", selected.board)}
                          {field("Mode", selected.mode)}
                          {field("Admission Date", selected.admissionDate)}
                          {field("School", selected.school)}
                          {field("Previous School", selected.previousSchool)}
                        </div>
                        <div className="mt-3">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Subjects Enrolled</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {(selected.subjects ?? []).length > 0
                              ? (selected.subjects ?? []).map(s => (
                                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                                ))
                              : <span className="text-xs text-muted-foreground">—</span>
                            }
                          </div>
                        </div>
                      </div>

                      {/* Section 2 — Personal Details */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <User className="h-4 w-4 text-[#0D7C8F]" />
                          <p className="text-sm font-bold text-[#1E2A4A] uppercase tracking-wide">Personal Details</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {field("Date of Birth", selected.dob)}
                          {field("Gender", selected.gender)}
                          {field("Email", selected.email)}
                          {field("Father's Name", selected.fatherName)}
                          {field("Father's Occupation", selected.fatherOccupation)}
                          {field("Mother's Name", selected.motherName)}
                          {field("Mother's Occupation", selected.motherOccupation)}
                          {field("Address", [selected.address, selected.city, selected.pincode].filter(Boolean).join(", ") || undefined)}
                        </div>
                      </div>

                      {/* Section 3 — Contact */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Phone className="h-4 w-4 text-[#0D7C8F]" />
                          <p className="text-sm font-bold text-[#1E2A4A] uppercase tracking-wide">Contact Details</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {field("Parent / Guardian", selected.parentName)}
                          {field("Phone", selected.phone)}
                          {field("WhatsApp", selected.whatsapp)}
                        </div>
                      </div>

                      {/* Signature section */}
                      <div className="grid grid-cols-3 gap-6 pt-6 border-t">
                        {["Student Signature", "Parent Signature", "Authorized By"].map(label => (
                          <div key={label} className="text-center">
                            <div className="h-12 border-b border-dashed border-slate-300 mb-1" />
                            <p className="text-xs text-muted-foreground">{label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="text-center text-xs text-muted-foreground border-t pt-4">
                        <p>Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                        <p className="font-medium mt-0.5">{settings.appName} · {currentBranch} Branch</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
