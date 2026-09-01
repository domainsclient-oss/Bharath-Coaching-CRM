"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  MessageSquare,
  ArrowLeft,
  Users,
  IndianRupee,
  AlertCircle,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  name: string;
  class: string;
  board: string;
  mode: string;
  status: string;
  parentName?: string;
  phone?: string;
  whatsapp?: string;
  billNo?: string;
  totalFees?: number;
  collectedFees?: number;
  balance?: number;
  discontinuedReason?: string;
  discontinuedDate?: string;
  branchId: string;
}

export default function DiscontinuedStudentsPage() {
  const { currentBranch } = useBranch();
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("All");

  const { data: allStudents, loading } = useFirestoreCollection<Student>(
    "students",
    currentBranch,
    { conditions: [{ field: "status", operator: "==", value: "Discontinued" }] }
  );

  const filtered = useMemo(() => {
    return allStudents.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.appNo ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = classFilter === "All" || s.class === classFilter;
      return matchSearch && matchClass;
    });
  }, [allStudents, searchTerm, classFilter]);

  const totalOutstanding = filtered.reduce((acc, s) => acc + (s.balance ?? 0), 0);

  const handleRemind = (s: Student) => {
    const phone = (s.whatsapp ?? s.phone ?? "").replace(/\D/g, "");
    if (!phone) return;
    const msg = encodeURIComponent(
      `Dear ${s.parentName ?? s.name}, this is a reminder that a fee balance of ₹${(s.balance ?? 0).toLocaleString()} is pending. Please contact us at your earliest convenience.`
    );
    window.open(`https://wa.me/91${phone}?text=${msg}`, "_blank");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Discontinued Students" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb & header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/students" className="hover:text-[#0D7C8F]">Students</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Discontinued</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Discontinued Students</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/students">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-none shadow-sm border-l-4 border-[#1E2A4A]">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-[#1E2A4A]/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-[#1E2A4A]" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Total Discontinued</p>
                <h3 className="text-2xl font-bold text-[#1E2A4A]">{filtered.length}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm border-l-4 border-red-500">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-red-50 p-3 rounded-full">
                <IndianRupee className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Total Outstanding Balance</p>
                <h3 className="text-2xl font-bold text-red-600">₹{totalOutstanding.toLocaleString("en-IN")}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Classes</SelectItem>
                  {["8", "9", "10", "11", "12"].map((c) => (
                    <SelectItem key={c} value={c}>Class {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filtered.length}</span> of{" "}
              {allStudents.length} discontinued students
            </div>
          </CardContent>
        </Card>

        {/* Loading skeleton */}
        {loading && (
          <Card className="border-none shadow-sm">
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
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
                    <TableHead>Class</TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead className="text-right">Total Fees</TableHead>
                    <TableHead className="text-right">Collected</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="hidden md:table-cell">Reason</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? (
                    filtered.map((s) => (
                      <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell>
                          <div>
                            <p className="text-sm font-bold text-[#1E2A4A]">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground">{s.parentName ?? "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">Class {s.class}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {s.billNo ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {s.totalFees != null ? `₹${s.totalFees.toLocaleString("en-IN")}` : "—"}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {s.collectedFees != null ? `₹${s.collectedFees.toLocaleString("en-IN")}` : "—"}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${(s.balance ?? 0) > 0 ? "text-red-600" : "text-slate-500"}`}>
                          {s.balance != null ? `₹${s.balance.toLocaleString("en-IN")}` : "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[160px]">
                          <p className="text-xs truncate" title={s.discontinuedReason}>
                            {s.discontinuedReason ?? "—"}
                          </p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground whitespace-nowrap">
                          {s.discontinuedDate ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={() => handleRemind(s)}
                            disabled={!(s.whatsapp ?? s.phone)}
                            title="Send WhatsApp Reminder"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-600">No discontinued students found</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {allStudents.length === 0
                                ? "No students have been marked as Discontinued in this branch."
                                : "Try adjusting your search or class filter."}
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
