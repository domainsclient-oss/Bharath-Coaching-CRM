"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Search, RotateCcw, GraduationCap, Users } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useBranch } from "@/context/BranchContext";

interface Student {
  id: string;
  appNo?: string;
  name: string;
  class?: string;
  board?: string;
  school?: string;
  subjects?: string[];
  mode?: string;
  status?: string;
  branchId: string;
}

const MODES   = ["Offline", "Online"];
const CLASSES = ["8", "9", "10", "11", "12"];
const BOARDS  = ["CBSE", "ICSE", "State", "Samacheer", "IB"];

/** The three filters the search requires before it will run. */
interface Criteria {
  mode: string;
  class: string;
  board: string;
  subject: string;
}

export default function StudentDetailsPage() {
  const { currentBranch } = useBranch();

  // Every student in the branch. Mode is filtered here rather than in the query
  // because useFirestoreCollection holds its conditions in a ref and does not
  // re-subscribe when they change, so a mode switch would return stale rows.
  const { data: allStudents, loading } = useFirestoreCollection<Student>("students", currentBranch);

  const [mode,    setMode]    = useState("Offline");
  const [classF,  setClassF]  = useState("");
  const [boardF,  setBoardF]  = useState("");
  const [subject, setSubject] = useState("");

  // Criteria of the last search that was actually run. Null until the first
  // search, so the table never shows the whole roll before anything is asked.
  const [applied, setApplied] = useState<Criteria | null>(null);

  const studentsInMode = useMemo(
    () => allStudents.filter(s => (s.mode ?? "Offline") === mode),
    [allStudents, mode],
  );

  // Subject options come from the student records themselves, not a master
  // list, so a subject offered here always has at least one student behind it.
  const subjectOptions = useMemo(() => {
    const set = new Set<string>();
    studentsInMode.forEach(s => (s.subjects ?? []).forEach(sub => {
      const name = sub?.trim();
      if (name) set.add(name);
    }));
    return Array.from(set).sort();
  }, [studentsInMode]);

  const canSearch = Boolean(classF && boardF && subject);

  const results = useMemo(() => {
    if (!applied) return [];
    return allStudents
      .filter(s =>
        (s.mode ?? "Offline") === applied.mode &&
        s.class === applied.class &&
        s.board === applied.board &&
        (s.subjects ?? []).some(sub => sub?.trim() === applied.subject)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allStudents, applied]);

  const handleSearch = () => {
    if (!canSearch) return;
    setApplied({ mode, class: classF, board: boardF, subject });
  };

  const handleReset = () => {
    setClassF("");
    setBoardF("");
    setSubject("");
    setApplied(null);
  };

  // Switching mode invalidates the subject list, so clear the subject and the
  // results rather than leaving a stale table under a new heading.
  const handleModeChange = (value: string) => {
    setMode(value);
    setSubject("");
    setApplied(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Students Detail" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/students" className="hover:text-[#0D7C8F]">Students</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Students Detail</span>
        </div>

        {/* Title + mode picker */}
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Students Detail</h2>
          <Select value={mode} onValueChange={handleModeChange}>
            <SelectTrigger className="h-9 w-32 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODES.map(m => <SelectItem key={m} value={m}>{m.toLowerCase()}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Search criteria */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Class <span className="text-red-500">*</span></Label>
                <Select value={classF} onValueChange={setClassF}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {CLASSES.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Board <span className="text-red-500">*</span></Label>
                <Select value={boardF} onValueChange={setBoardF}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select board" /></SelectTrigger>
                  <SelectContent>
                    {BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Subject <span className="text-red-500">*</span></Label>
                <Select value={subject} onValueChange={setSubject} disabled={subjectOptions.length === 0}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={subjectOptions.length === 0 ? "No subjects on record" : "Select subject"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2 h-10 flex-1"
                  onClick={handleSearch}
                  disabled={!canSearch || loading}
                >
                  <Search className="h-4 w-4" /> Search
                </Button>
                {(applied || classF || boardF || subject) && (
                  <Button variant="ghost" className="h-10 text-muted-foreground gap-1.5" onClick={handleReset}>
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </Button>
                )}
              </div>
            </div>

            {!canSearch && (
              <p className="text-xs text-muted-foreground mt-3">
                Choose a class, a board and a subject, then press Search.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="border-none shadow-sm overflow-hidden">
          {applied && (
            <div className="flex items-center justify-between gap-3 flex-wrap border-b bg-white px-4 py-2.5">
              <p className="text-sm font-semibold text-[#1E2A4A]">
                {results.length} {results.length === 1 ? "student" : "students"} found
              </p>
              <p className="text-xs text-muted-foreground">
                {applied.mode} · Class {applied.class} · {applied.board} · {applied.subject}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[130px]">Application No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="w-[90px]">Class</TableHead>
                  <TableHead className="w-[110px]">Board</TableHead>
                  <TableHead>School Name</TableHead>
                  <TableHead>Subject</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !applied ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Search className="h-8 w-8 opacity-20" />
                        <p className="text-sm">Set the class, board and subject above to list students.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8 opacity-20" />
                        <p className="text-sm">
                          No {applied.mode.toLowerCase()} student in Class {applied.class} ({applied.board}) takes {applied.subject}.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : results.map(s => (
                  <TableRow key={s.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-xs font-semibold text-[#0D7C8F]">
                      {s.appNo || "—"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/students/${s.id}`}
                        className="font-semibold text-sm text-[#1E2A4A] hover:text-[#0D7C8F] hover:underline"
                      >
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{s.class || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{s.board || "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 flex-shrink-0 opacity-40" />
                        {s.school || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(s.subjects ?? []).map(sub => (
                          <Badge
                            key={sub}
                            variant={sub?.trim() === applied.subject ? "default" : "outline"}
                            className={
                              sub?.trim() === applied.subject
                                ? "text-[10px] bg-[#0D7C8F] hover:bg-[#0D7C8F]"
                                : "text-[10px] text-muted-foreground"
                            }
                          >
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
}
