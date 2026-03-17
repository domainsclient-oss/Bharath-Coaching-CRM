
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  ChevronRight, 
  Eye, 
  UserCheck, 
  XCircle,
  Calendar,
  Filter,
  ArrowLeft
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
import { mockOnlineAdmissions, OnlineAdmission } from "@/data/onlineAdmissionsData";
import { toast } from "@/hooks/use-toast";

export default function OnlineAdmissionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredAdmissions = useMemo(() => {
    return mockOnlineAdmissions.filter((admission) => {
      const matchesSearch = admission.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           admission.appNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || admission.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (status: OnlineAdmission["status"]) => {
    switch (status) {
      case "New":
        return <Badge className="bg-blue-500 hover:bg-blue-600">New</Badge>;
      case "Contacted":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Contacted</Badge>;
      case "Admitted":
        return <Badge className="bg-green-500 hover:bg-green-600">Admitted</Badge>;
      case "Rejected":
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleReject = (id: string) => {
    toast({
      title: "Application Rejected",
      description: `Enquiry ${id} has been marked as rejected.`,
      variant: "destructive"
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Online Admissions" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/students" className="hover:text-[#0D7C8F]">Students</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Online Admissions</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Website Enquiries</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/students"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Students</Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or app no..." 
                  className="pl-10 h-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Admitted">Admitted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-10 flex-1 gap-2">
                  <Calendar className="h-4 w-4" /> Date Range
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-10 text-[#0D7C8F]"
                  onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}
                >
                  Reset
                </Button>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filteredAdmissions.length}</span> website enquiries
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>App No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Board</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmissions.length > 0 ? (
                filteredAdmissions.map((admission) => (
                  <TableRow key={admission.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-xs text-[#1E2A4A]">{admission.appNo}</TableCell>
                    <TableCell className="font-bold">{admission.name}</TableCell>
                    <TableCell>Class {admission.class}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">{admission.board}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col text-xs">
                        <span className="font-medium">{admission.phone}</span>
                        <span className="text-muted-foreground">{admission.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{admission.submittedDate}</TableCell>
                    <TableCell>{getStatusBadge(admission.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#0D7C8F] hover:bg-[#0D7C8F]/10">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-green-600 hover:bg-green-50"
                          title="Convert to Student"
                          asChild
                        >
                          <Link href={`/admin/students/add?fromOnline=${admission.id}&name=${encodeURIComponent(admission.name)}&class=${admission.class}&board=${admission.board}&phone=${admission.phone}&email=${admission.email}`}>
                            <UserCheck className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={() => handleReject(admission.id)}
                          title="Reject Application"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No online admissions found matching your criteria.
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
