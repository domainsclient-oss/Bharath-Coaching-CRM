"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Eye,
  ArrowLeft,
  GraduationCap,
  Monitor,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useBranch } from "@/context/BranchContext";
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
  parentName?: string;
  phone?: string;
  email?: string;
  photo?: string;
  admissionDate?: string;
  subjects?: string[];
  branchId: string;
}

export default function OnlineAdmissionsPage() {
  const { currentBranch } = useBranch();
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // ── students collection, mode == "Online", current branch ─────────────────
  const { data: allStudents, loading } = useFirestoreCollection<Student>(
    "students",
    currentBranch,
    { conditions: [{ field: "mode", operator: "==", value: "Online" }] }
  );

  const filtered = useMemo(() => {
    return allStudents.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.appNo ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass  = classFilter  === "All" || s.class  === classFilter;
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      return matchSearch && matchClass && matchStatus;
    });
  }, [allStudents, searchTerm, classFilter, statusFilter]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Active:       "text-green-700 border-green-200 bg-green-50",
      Discontinued: "text-red-600 border-red-200 bg-red-50",
      Alumni:       "text-slate-500 border-slate-200 bg-slate-50",
    };
    return (
      <Badge variant="outline" className={`text-[10px] font-bold ${styles[status] ?? ""}`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Online Admissions" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
        {/* Breadcrumb & header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/students" className="hover:text-[#0D7C8F]">Students</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Online Admissions</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[#1E2A4A]">Online Students</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Students admitted through online mode in {currentBranch} branch
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/students">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Online", value: allStudents.length, color: "text-[#0D7C8F]" },
            { label: "Active",       value: allStudents.filter(s => s.status === "Active").length,       color: "text-green-600" },
            { label: "Discontinued", value: allStudents.filter(s => s.status === "Discontinued").length, color: "text-red-500"   },
            { label: "Alumni",       value: allStudents.filter(s => s.status === "Alumni").length,       color: "text-slate-500" },
          ].map(k => (
            <Card key={k.label} className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#0D7C8F]/10 flex items-center justify-center flex-shrink-0">
                  <Monitor className="h-5 w-5 text-[#0D7C8F]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or app no..."
                  className="pl-10 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Classes</SelectItem>
                  {["8","9","10","11","12"].map(c => (
                    <SelectItem key={c} value={c}>Class {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Discontinued">Discontinued</SelectItem>
                  <SelectItem value="Alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing <span className="font-bold text-foreground">{filtered.length}</span> of{" "}
                {allStudents.length} online students
              </span>
              {(searchTerm || classFilter !== "All" || statusFilter !== "All") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-[#0D7C8F] px-2"
                  onClick={() => { setSearchTerm(""); setClassFilter("All"); setStatusFilter("All"); }}
                >
                  Reset filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading skeleton */}
        {loading && (
          <Card className="border-none shadow-sm">
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          </Card>
        )}

        {/* Table */}
        {!loading && (
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>App No</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Board</TableHead>
                    <TableHead className="hidden lg:table-cell">Subjects</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead className="hidden md:table-cell">Admitted On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? (
                    filtered.map((s) => (
                      <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Student name + avatar */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                              <AvatarImage src={s.photo} />
                              <AvatarFallback className="bg-[#0D7C8F]/10 text-[#0D7C8F] text-xs font-bold">
                                {getInitials(s.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold text-[#1E2A4A]">{s.name}</p>
                              <p className="text-[10px] text-muted-foreground">{s.parentName ?? "—"}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {s.appNo ?? "—"}
                        </TableCell>

                        <TableCell className="text-sm">Class {s.class}</TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {s.board}
                          </Badge>
                        </TableCell>

                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(s.subjects ?? []).slice(0, 2).map((sub) => (
                              <Badge key={sub} variant="secondary" className="text-[9px] px-1.5 py-0 font-normal">
                                {sub}
                              </Badge>
                            ))}
                            {(s.subjects ?? []).length > 2 && (
                              <span className="text-[9px] text-muted-foreground">
                                +{(s.subjects ?? []).length - 2}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          <div className="text-xs">
                            <p className="font-medium">{s.phone ?? "—"}</p>
                            <p className="text-muted-foreground">{s.email ?? "—"}</p>
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {s.admissionDate ?? "—"}
                        </TableCell>

                        <TableCell>{statusBadge(s.status)}</TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#0D7C8F] hover:bg-[#0D7C8F]/10"
                            asChild
                          >
                            <Link href={`/admin/students/${s.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-48 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
                            <GraduationCap className="h-7 w-7 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-600">No online students found</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {allStudents.length === 0
                                ? "No students with Online mode have been added to this branch yet."
                                : "Try adjusting your filters."}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
