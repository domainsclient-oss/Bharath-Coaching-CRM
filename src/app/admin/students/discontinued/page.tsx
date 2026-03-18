
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  ChevronRight, 
  MessageSquare,
  Calendar,
  Filter,
  ArrowLeft,
  Users,
  IndianRupee,
  AlertCircle
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockStudents, Student } from "@/data/studentsData";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { toast } from "@/hooks/use-toast";

export default function DiscontinuedStudentsPage() {
  useAuth();
  const { currentBranch } = useBranch();
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("All");

  const discontinuedStudents = useMemo(() => {
    return mockStudents.filter((student) => {
      const isDiscontinued = student.status === "Discontinued";
      const isCorrectBranch = student.branchId === currentBranch;
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = classFilter === "All" || student.class === classFilter;
      
      return isDiscontinued && isCorrectBranch && matchesSearch && matchesClass;
    });
  }, [currentBranch, searchTerm, classFilter]);

  const totalOutstanding = discontinuedStudents.reduce((acc, curr) => acc + (curr.balance || 0), 0);

  const handleRemind = (student: Student) => {
    toast({
      title: "Reminder Sent",
      description: `A fee reminder for ₹${student.balance} has been sent to ${student.name} via WhatsApp.`,
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Discontinued Students" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/students" className="hover:text-[#0D7C8F]">Students</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Discontinued</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Discontinued Students</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/students"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Students</Link>
            </Button>
          </div>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-none shadow-sm border-l-4 border-[#1E2A4A]">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-[#1E2A4A]/10 p-3 rounded-full text-[#1E2A4A]">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Total Discontinued</p>
                <h3 className="text-2xl font-bold text-[#1E2A4A]">{discontinuedStudents.length}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm border-l-4 border-red-500">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-red-50 p-3 rounded-full text-red-600">
                <IndianRupee className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Total Outstanding Balance</p>
                <h3 className="text-2xl font-bold text-red-600">₹{totalOutstanding.toLocaleString()}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by student name..." 
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
                  {["8", "9", "10", "11", "12"].map(cls => (
                    <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-10 gap-2">
                <Calendar className="h-4 w-4" /> Date Range
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Bill No</TableHead>
                <TableHead>Total Fees</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discontinuedStudents.length > 0 ? (
                discontinuedStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold">{student.name}</TableCell>
                    <TableCell>Class {student.class}</TableCell>
                    <TableCell className="text-xs font-mono">{student.billNo}</TableCell>
                    <TableCell>₹{student.totalFees?.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">₹{student.collectedFees?.toLocaleString()}</TableCell>
                    <TableCell className={student.balance && student.balance > 0 ? "text-red-600 font-bold" : "text-slate-600"}>
                      ₹{student.balance?.toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs" title={student.discontinuedReason}>
                      {student.discontinuedReason}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{student.discontinuedDate}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-[#0D7C8F] hover:bg-[#0D7C8F]/10"
                        onClick={() => handleRemind(student)}
                        disabled={!student.balance || student.balance <= 0}
                        title="Send Reminder"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-8 w-8 opacity-20" />
                      <p>No discontinued students found for this branch.</p>
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
