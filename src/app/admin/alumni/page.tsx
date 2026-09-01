"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Search, GraduationCap, MessageSquare, Phone,
  Download, Users, Calendar,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { toast } from "@/hooks/use-toast";

interface StudentDoc {
  id: string;
  name: string;
  appNo?: string;
  rollNo?: string;
  class?: string;
  board?: string;
  subjects?: string[];
  mode?: string;
  admissionDate?: string;
  discontinuedDate?: string;
  previousSchoolMarks?: number;
  phone?: string;
  email?: string;
  status: string;
  branchId: string;
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getPassingYear(date?: string) {
  return date ? new Date(date).getFullYear() : null;
}

export default function AlumniPage() {
  const { currentBranch } = useBranch();
  const [search,      setSearch]      = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [boardFilter, setBoardFilter] = useState("All");
  const [yearFilter,  setYearFilter]  = useState("All");

  const { data: allStudents, loading } = useFirestoreCollection<StudentDoc>("students", currentBranch);

  // Discontinued students are the alumni — status is set to "Discontinued" when a student leaves
  const allAlumni = useMemo(
    () => allStudents.filter(s => s.status === "Discontinued" || s.status === "Alumni"),
    [allStudents],
  );

  // Derive filter options from real data
  const classes = useMemo(() => {
    const set = new Set(allAlumni.map(s => s.class).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [allAlumni]);

  const boards = useMemo(() => {
    const set = new Set(allAlumni.map(s => s.board).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [allAlumni]);

  const passingYears = useMemo(() => {
    const set = new Set(
      allAlumni.map(s => getPassingYear(s.discontinuedDate)).filter(Boolean) as number[]
    );
    return ["All", ...Array.from(set).sort((a, b) => b - a).map(String)];
  }, [allAlumni]);

  const filtered = useMemo(() =>
    allAlumni.filter(s => {
      const py = getPassingYear(s.discontinuedDate);
      return (
        (classFilter === "All" || s.class === classFilter) &&
        (boardFilter === "All" || s.board === boardFilter) &&
        (yearFilter  === "All" || String(py) === yearFilter) &&
        (!search || [s.name, s.appNo, s.rollNo].some(
          f => f?.toLowerCase().includes(search.toLowerCase())
        ))
      );
    }),
    [allAlumni, classFilter, boardFilter, yearFilter, search],
  );

  const thisYearAlumni = allAlumni.filter(
    s => getPassingYear(s.discontinuedDate) === new Date().getFullYear()
  ).length;
  const onlineAlumni = allAlumni.filter(s => s.mode === "Online").length;

  const handleExport = () => {
    const headers = ["Name","App No","Roll No","Class","Board","Mode","Joined","Passed Out","Phone","Email"];
    const rows = filtered.map(s =>
      [s.name, s.appNo ?? "", s.rollNo ?? "", s.class ?? "", s.board ?? "",
       s.mode ?? "", s.admissionDate ?? "", s.discontinuedDate ?? "", s.phone ?? "", s.email ?? ""].join(",")
    );
    const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `alumni-${currentBranch}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Alumni — Old Students Data" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Alumni</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Old Students Data</h2>
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Alumni",         value: allAlumni.length,  icon: GraduationCap, bg: "bg-[#1E2A4A]/10", color: "text-[#1E2A4A]" },
            { label: "Passed Out This Year", value: thisYearAlumni,    icon: Calendar,      bg: "bg-teal-100",     color: "text-teal-600"   },
            { label: "Online Mode Alumni",   value: onlineAlumni,      icon: Users,         bg: "bg-blue-100",     color: "text-blue-600"   },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    {loading
                      ? <Skeleton className="h-7 w-12 mt-1" />
                      : <p className="text-2xl font-bold text-[#1E2A4A]">{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Name, App No, Roll No..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={boardFilter} onValueChange={setBoardFilter}>
                <SelectTrigger><SelectValue placeholder="All Boards" /></SelectTrigger>
                <SelectContent>
                  {boards.map(b => (
                    <SelectItem key={b} value={b}>{b === "All" ? "All Boards" : b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger><SelectValue placeholder="All Years" /></SelectTrigger>
                <SelectContent>
                  {passingYears.map(y => (
                    <SelectItem key={y} value={y}>{y === "All" ? "All Years" : `Batch ${y}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">
              {loading ? "Loading..." : `${filtered.length} Alumni Record${filtered.length !== 1 ? "s" : ""}`}
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>App No / Roll</TableHead>
                <TableHead>Class / Board</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Passed Out</TableHead>
                <TableHead>Marks %</TableHead>
                <TableHead className="text-right">Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(9)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length > 0 ? filtered.map(student => (
                <TableRow key={student.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback className="bg-[#1E2A4A]/10 text-[#1E2A4A] text-xs font-bold">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-[#1E2A4A]">{student.name}</p>
                        {student.email && (
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-mono text-muted-foreground">{student.appNo ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{student.rollNo ?? "—"}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{student.class ? `Class ${student.class}` : "—"}</p>
                    {student.board && <Badge variant="outline" className="text-xs mt-0.5">{student.board}</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {(student.subjects ?? []).map(s => (
                        <Badge key={s} variant="secondary" className="text-xs py-0">{s}</Badge>
                      ))}
                      {(!student.subjects || student.subjects.length === 0) && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.mode
                      ? <Badge variant="outline" className="text-xs">{student.mode}</Badge>
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{student.admissionDate ?? "—"}</TableCell>
                  <TableCell>
                    {student.discontinuedDate ? (
                      <div>
                        <p className="text-sm font-semibold text-[#0D7C8F]">
                          Batch {getPassingYear(student.discontinuedDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">{student.discontinuedDate}</p>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {student.previousSchoolMarks ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#0D7C8F]"
                            style={{ width: `${Math.min(student.previousSchoolMarks, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#1E2A4A]">{student.previousSchoolMarks}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-[#0D7C8F]"
                        title="Call"
                        onClick={() => toast({ title: "Calling", description: `Calling ${student.name} at ${student.phone ?? "—"}` })}
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-green-600"
                        title="WhatsApp"
                        onClick={() => toast({ title: "WhatsApp", description: `Opening WhatsApp for ${student.name}` })}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <GraduationCap className="h-8 w-8 opacity-20" />
                      <p>No alumni records found{search || classFilter !== "All" || boardFilter !== "All" || yearFilter !== "All" ? " matching your filters" : ` for ${currentBranch}`}.</p>
                      {allAlumni.length === 0 && !loading && (
                        <p className="text-xs">Discontinued students will appear here as alumni records.</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
