"use client";

import { CLASS_FILTER_OPTIONS } from "@/config/academics";
import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { ChevronRight, Search, Printer, FileText, User, BookOpen, Phone, MapPin, Mail } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { currentBranch, branches } = useBranch();
  const { settings } = useSettings();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
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
      (classFilter === "all" || s.class === classFilter) &&
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

    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return;

    // Grab all stylesheet links from the current page
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join("\n");

    // The @page rule here comes after globals.css, whose A4 *landscape* rule
    // would otherwise apply and push the form onto a second page.
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Application Form — ${selected?.name ?? ""}</title>
          ${styles}
          <style>
            @page { size: A4 portrait; margin: 0; }
            html, body { margin: 0; padding: 0; background: #e2e8f0; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .a4-sheet { margin: 16px auto; }
            @media print {
              html, body { width: 210mm; height: 297mm; overflow: hidden; background: white; }
              .a4-sheet { margin: 0; box-shadow: none !important; }
            }
          </style>
        </head>
        <body>
          ${content.outerHTML}
          <script>
            window.onload = function() {
              // Safety net: an unusually long address or subject list shrinks
              // the content to fit rather than spilling onto a second page.
              var sheet = document.querySelector('.a4-sheet');
              var body  = sheet && sheet.querySelector('.a4-body');
              if (body && body.scrollHeight > body.clientHeight) {
                body.style.zoom = String(body.clientHeight / body.scrollHeight);
              }
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          <\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const field = (label: string, value?: string | null, className = "") => (
    <div className={`border-b border-slate-300 pb-1 min-w-0 ${className}`}>
      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wide">{label}</p>
      <p className="text-[12px] font-medium text-[#1E2A4A] mt-0.5 break-words leading-snug">{value || "—"}</p>
    </div>
  );

  const section = (Icon: typeof User, title: string) => (
    <div className="flex items-center gap-2 mb-2.5 pb-1 border-b-2 border-[#0D7C8F]">
      <Icon className="h-3.5 w-3.5 text-[#0D7C8F]" />
      <p className="text-[11px] font-bold text-[#1E2A4A] uppercase tracking-wider">{title}</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <div className="print:hidden"><SharedHeader title="Student Application Form" /></div>
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
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
                    <Input autoCapitalize="off" className="pl-10" placeholder="Name or App No..."
                      value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Class</Label>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                    <SelectContent>
                      {CLASS_FILTER_OPTIONS.map(c => (
                        <SelectItem key={c} value={c}>{c === "all" ? "All Classes" : `Class ${c}`}</SelectItem>
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

                {/* A4 sheet: exactly 210 × 297 mm on screen and on paper. */}
                <div className="overflow-x-auto pb-2">
                  <div
                    ref={printRef}
                    className="a4-sheet mx-auto bg-white text-[#1E2A4A] shadow-md w-[210mm] h-[297mm] p-[12mm] box-border flex flex-col overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-[#1E2A4A] text-white px-6 py-4 rounded-md shrink-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h1 className="text-xl font-bold leading-tight">{settings.appName}</h1>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-white/60 uppercase font-bold tracking-wide">Application No</p>
                          <p className="text-base font-mono font-bold text-[#5FD3E4]">{selected.appNo || "—"}</p>
                        </div>
                      </div>
                      <p className="text-center text-xs font-bold uppercase tracking-[0.25em] mt-3 border-t border-white/20 pt-2.5">
                        Student Admission Application Form
                      </p>
                    </div>

                    <div className="a4-body flex-1 min-h-0 flex flex-col pt-5">
                      {/* Photo + name + status */}
                      <div className="flex items-start justify-between gap-4 mb-5">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-[35mm] w-[28mm] border border-slate-400 rounded-sm flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden">
                            {selected.photo
                              ? <img src={selected.photo} alt="" className="h-full w-full object-cover" />
                              : <span className="text-[9px] text-slate-400 text-center px-1 leading-tight">Affix passport size photo</span>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wide">Student Name</p>
                            <p className="text-xl font-bold leading-tight break-words">{selected.name}</p>
                            <p className="text-xs text-slate-500 mt-1">Roll No: <span className="font-semibold text-[#1E2A4A]">{selected.rollNo || "—"}</span></p>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${selected.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {selected.status}
                        </span>
                      </div>

                      {/* Section 1 — Academic Details */}
                      <div className="mb-5">
                        {section(BookOpen, "Academic Details")}
                        <div className="grid grid-cols-3 gap-x-5 gap-y-3">
                          {field("Class", `Class ${selected.class}`)}
                          {field("Board", selected.board)}
                          {field("Mode", selected.mode)}
                          {field("Admission Date", selected.admissionDate)}
                          {field("School", selected.school)}
                          {field("Previous School", selected.previousSchool)}
                          {field("Subjects Enrolled", (selected.subjects ?? []).join(", ") || undefined, "col-span-3")}
                        </div>
                      </div>

                      {/* Section 2 — Personal Details */}
                      <div className="mb-5">
                        {section(User, "Personal Details")}
                        <div className="grid grid-cols-3 gap-x-5 gap-y-3">
                          {field("Date of Birth", selected.dob)}
                          {field("Gender", selected.gender)}
                          {field("Email", selected.email)}
                          {field("Father's Name", selected.fatherName)}
                          {field("Father's Occupation", selected.fatherOccupation)}
                          <div />
                          {field("Mother's Name", selected.motherName)}
                          {field("Mother's Occupation", selected.motherOccupation)}
                          <div />
                          {field("Address", [selected.address, selected.city, selected.pincode].filter(Boolean).join(", ") || undefined, "col-span-3")}
                        </div>
                      </div>

                      {/* Section 3 — Contact */}
                      <div>
                        {section(Phone, "Contact Details")}
                        <div className="grid grid-cols-3 gap-x-5 gap-y-3">
                          {field("Parent / Guardian", selected.parentName)}
                          {field("Phone", selected.phone)}
                          {field("WhatsApp", selected.whatsapp)}
                        </div>
                      </div>

                      {/* Signatures + footer pinned to the bottom of the page */}
                      <div className="mt-auto pt-6">
                        <div className="grid grid-cols-3 gap-8">
                          {["Student Signature", "Parent Signature", "Authorized By"].map(label => (
                            <div key={label} className="text-center">
                              <div className="h-12 border-b border-slate-500 mb-1" />
                              <p className="text-[10px] text-slate-600">{label}</p>
                            </div>
                          ))}
                        </div>
                        <div className="text-center text-[10px] text-slate-500 border-t border-slate-300 mt-5 pt-2">
                          <p className="flex items-center justify-center gap-1.5">
                            <MapPin className="h-2.5 w-2.5" /> {settings.address}
                          </p>
                          <p className="flex items-center justify-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {settings.contactPhone}</span>
                            <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {settings.contactEmail}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
