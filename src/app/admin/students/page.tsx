
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  UserPlus, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  Pencil, 
  XCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  GraduationCap
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { mockStudents, Student } from "@/data/studentsData";

export default function StudentListPage() {
  useAuth();
  const { currentBranch } = useBranch();
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedBoard, setSelectedBoard] = useState("All");
  const [selectedMode, setSelectedMode] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter logic
  const filteredStudents = useMemo(() => {
    return mockStudents.filter(student => {
      // 1. Branch Filter
      if (student.branchId !== currentBranch) return false;

      // 2. Search Term Filter
      const searchMatch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        student.appNo.toLowerCase().includes(searchTerm.toLowerCase());
      if (!searchMatch) return false;

      // 3. Class Filter
      if (selectedClass !== "All" && student.class !== selectedClass) return false;

      // 4. Board Filter
      if (selectedBoard !== "All" && student.board !== selectedBoard) return false;

      // 5. Mode Filter
      if (selectedMode !== "All" && student.mode !== selectedMode) return false;

      // 6. Status Filter
      if (selectedStatus !== "All" && student.status !== selectedStatus) return false;

      return true;
    });
  }, [currentBranch, searchTerm, selectedClass, selectedBoard, selectedMode, selectedStatus]);

  // Pagination logic
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleReset = () => {
    setSearchTerm("");
    setSelectedClass("All");
    setSelectedBoard("All");
    setSelectedMode("All");
    setSelectedStatus("All");
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Students" />
      
      <main className="p-4 md:p-6 space-y-6">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#1E2A4A]">Student Directory</h2>
            <div className="flex items-center text-xs text-muted-foreground gap-2">
              <Link href="/admin" className="hover:text-primary">Dashboard</Link>
              <span>/</span>
              <span className="font-medium text-foreground">Students</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden md:flex gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Link href="/admin/students/add">
              <Button size="sm" className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
                <UserPlus className="h-4 w-4" /> Add Student
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative lg:col-span-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search name, app no..." 
                  className="pl-10 h-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Classes</SelectItem>
                  {["8", "9", "10", "11", "12"].map(cls => (
                    <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Board" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Boards</SelectItem>
                  <SelectItem value="CBSE">CBSE</SelectItem>
                  <SelectItem value="ICSE">ICSE</SelectItem>
                  <SelectItem value="State">State</SelectItem>
                  <SelectItem value="IB">IB</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Modes</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-10 flex-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Discontinued">Discontinued</SelectItem>
                    <SelectItem value="Alumni">Alumni</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-[#0D7C8F] h-10"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filteredStudents.length}</span> of {mockStudents.filter(s => s.branchId === currentBranch).length} students
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[120px]">App No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Board</TableHead>
                <TableHead className="hidden lg:table-cell">Subjects</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-xs text-[#1E2A4A]">{student.appNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border">
                          <AvatarImage src={student.photo} />
                          <AvatarFallback className="bg-[#0D7C8F]/10 text-[#0D7C8F] text-[10px] font-bold">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#1E2A4A]">{student.name}</span>
                          <span className="text-[10px] text-muted-foreground">{student.parentName}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">Class {student.class}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-medium border-slate-200">
                        {student.board}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {student.subjects.slice(0, 2).map((sub, i) => (
                          <Badge key={i} variant="secondary" className="text-[9px] py-0 px-1.5 font-normal">
                            {sub}
                          </Badge>
                        ))}
                        {student.subjects.length > 2 && (
                          <span className="text-[9px] text-muted-foreground ml-1">+{student.subjects.length - 2} more</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] font-bold ${student.mode === 'Online' ? 'bg-[#0D7C8F]' : 'bg-[#1E2A4A]'}`}>
                        {student.mode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] font-bold ${
                          student.status === 'Active' ? 'text-green-600 border-green-200 bg-green-50' : 
                          student.status === 'Discontinued' ? 'text-red-600 border-red-200 bg-red-50' : 
                          'text-gray-500 border-gray-200 bg-gray-50'
                        }`}
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                          <Link href={`/admin/students/${student.id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" asChild>
                          <Link href={`/admin/students/${student.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="rounded-full bg-slate-100 p-4">
                        <GraduationCap className="h-8 w-8 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-600">No students found</p>
                        <p className="text-xs text-slate-400">Try adjusting your filters or search criteria.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleReset}>Clear All Filters</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filteredStudents.length > itemsPerPage && (
            <div className="flex items-center justify-between p-4 bg-white border-t">
              <div className="text-xs text-muted-foreground">
                Page <span className="font-bold text-foreground">{currentPage}</span> of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
