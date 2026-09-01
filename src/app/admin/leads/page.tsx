
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  Filter, 
  MoreVertical, 
  PhoneCall, 
  Calendar,
  User,
  MessageSquare,
  ArrowRight
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
import {
  LEAD_STATUSES,
  SOURCE_COLORS,
  LeadStatus
} from "@/data/leadsData";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { cn } from "@/lib/utils";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Edit, Trash2, MoveRight } from "lucide-react";

interface Lead {
  id: string;
  enquiryNo?: string;
  name: string;
  age?: number;
  classInterested?: string;
  board?: string;
  parentName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  source: string;
  subjects?: string[];
  mode?: string;
  status: LeadStatus;
  assignedTo?: string;
  followUpDate?: string;
  notes?: string;
  branchId: string;
}

export default function EnquiryPipelinePage() {
  useAuth();
  const { currentBranch } = useBranch();
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSource, setSelectedSource] = useState("All");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    try {
      await updateDocument("enquiries", leadId, { status });
      toast({ title: "Status updated" });
    } catch {
      toast({ title: "Error", description: "Could not update status.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDocument("enquiries", deleteId);
      toast({ title: "Enquiry deleted", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Could not delete enquiry.", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  // ── Real-time Firestore subscription ─────────────────────────────────────
  const { data: allLeads } = useFirestoreCollection<Lead>("enquiries", currentBranch);

  const leads = useMemo(() => {
    return allLeads.filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (l.enquiryNo ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass  = selectedClass  === "All" || l.classInterested === selectedClass;
      const matchesSource = selectedSource === "All" || l.source           === selectedSource;
      return matchesSearch && matchesClass && matchesSource;
    });
  }, [allLeads, searchTerm, selectedClass, selectedSource]);

  const leadsByStatus = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {
      "New": [],
      "Contacted": [],
      "Interested": [],
      "Demo Scheduled": [],
      "Admitted": [],
      "Not Interested": []
    };
    leads.forEach(l => {
      map[l.status].push(l);
    });
    return map;
  }, [leads]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Lead Management" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
        {/* Header & Breadcrumbs */}
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Enquiry Pipeline</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Enquiry Pipeline</h2>
            
            <div className="flex items-center gap-2">
              <div className="bg-white border rounded-lg p-1 flex">
                <Button
                  variant={viewMode === "kanban" ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("h-8 gap-2", viewMode === "kanban" ? "bg-slate-100 text-[#1E2A4A]" : "text-slate-600 hover:text-[#1E2A4A]")}
                  onClick={() => setViewMode("kanban")}
                >
                  <LayoutGrid className="h-4 w-4" /> Kanban
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("h-8 gap-2", viewMode === "list" ? "bg-slate-100 text-[#1E2A4A]" : "text-slate-600 hover:text-[#1E2A4A]")}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" /> List View
                </Button>
              </div>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" asChild>
                <Link href="/admin/leads/add"><Plus className="h-4 w-4" /> New Enquiry</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search name or ENQ no..." 
                  className="pl-10 h-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Interested Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Classes</SelectItem>
                  {["8", "9", "10", "11", "12"].map(c => (
                    <SelectItem key={c} value={c}>Class {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Lead Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sources</SelectItem>
                  {Object.keys(SOURCE_COLORS).map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-10 gap-2">
                <Filter className="h-4 w-4" /> More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {viewMode === "kanban" ? (
          /* Kanban View */
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px] -mx-4 px-4 md:mx-0 md:px-0">
            {LEAD_STATUSES.map(status => (
              <div key={status} className="flex-shrink-0 w-80 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#1E2A4A] uppercase tracking-wider">{status}</h3>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-700 border-none font-bold text-[10px]">
                      {leadsByStatus[status].length}
                    </Badge>
                  </div>
                  {status === "New" && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                      <Link href="/admin/leads/add"><Plus className="h-4 w-4" /></Link>
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {leadsByStatus[status].map(lead => (
                    <Card key={lead.id} className="border-none shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <Link href={`/admin/leads/${lead.id}`} className="font-bold text-[#1E2A4A] hover:text-[#0D7C8F] transition-colors line-clamp-1">
                            {lead.name}
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/leads/${lead.id}`} className="flex items-center gap-2">
                                  <Eye className="h-3.5 w-3.5" /> View Profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/leads/add?edit=${lead.id}`} className="flex items-center gap-2">
                                  <Edit className="h-3.5 w-3.5" /> Edit Enquiry
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="flex items-center gap-2">
                                  <MoveRight className="h-3.5 w-3.5" /> Move to
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {LEAD_STATUSES.filter(s => s !== lead.status).map(s => (
                                    <DropdownMenuItem key={s} onClick={() => handleStatusChange(lead.id, s)}>
                                      {s}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 flex items-center gap-2"
                                onClick={() => setDeleteId(lead.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="text-[9px] font-bold h-4 bg-slate-100 text-slate-700">
                            Class {lead.classInterested}
                          </Badge>
                          <Badge className={cn("text-[9px] font-bold h-4 border", SOURCE_COLORS[lead.source as keyof typeof SOURCE_COLORS] ?? "bg-slate-100 text-slate-700 border-slate-200")}>
                            {lead.source}
                          </Badge>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Assigned: {lead.assignedTo}</span>
                          </div>
                          <div className={cn(
                            "flex items-center gap-2 text-[10px] font-medium",
                            lead.followUpDate && new Date(lead.followUpDate) < new Date() ? "text-red-600" : "text-amber-600"
                          )}>
                            <Calendar className="h-3 w-3" />
                            <span>Follow-up: {lead.followUpDate}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t mt-2">
                          <span className="text-[9px] text-slate-400 font-medium">{lead.enquiryNo}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-green-600 hover:bg-green-50 hover:text-green-700"
                              title="WhatsApp"
                              disabled={!lead.whatsapp && !lead.phone}
                              onClick={() => {
                                const num = (lead.whatsapp || lead.phone || "").replace(/\D/g, "");
                                window.open(`https://wa.me/${num}`, "_blank");
                              }}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              title="Call"
                              disabled={!lead.phone}
                              onClick={() => window.open(`tel:${lead.phone}`, "_self")}
                            >
                              <PhoneCall className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {leadsByStatus[status].length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center">
                      <span className="text-xs text-slate-300 italic font-medium">No leads</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <Card className="border-none shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[120px]">ENQ No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length > 0 ? (
                  leads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-xs text-[#1E2A4A]">{lead.enquiryNo}</TableCell>
                      <TableCell className="font-bold">{lead.name}</TableCell>
                      <TableCell>Class {lead.classInterested}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[10px] font-bold border", SOURCE_COLORS[lead.source as keyof typeof SOURCE_COLORS] ?? "bg-slate-100 text-slate-700 border-slate-200")}>
                          {lead.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{lead.phone}</TableCell>
                      <TableCell className="text-xs">{lead.assignedTo}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "text-xs font-bold",
                          lead.followUpDate && new Date(lead.followUpDate) < new Date() ? "text-red-600" : "text-amber-600"
                        )}>
                          {lead.followUpDate}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold capitalize">
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                            title="WhatsApp"
                            disabled={!lead.whatsapp && !lead.phone}
                            onClick={() => {
                              const num = (lead.whatsapp || lead.phone || "").replace(/\D/g, "");
                              window.open(`https://wa.me/${num}`, "_blank");
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            title="Call"
                            disabled={!lead.phone}
                            onClick={() => window.open(`tel:${lead.phone}`, "_self")}
                          >
                            <PhoneCall className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#0D7C8F]" asChild>
                            <Link href={`/admin/leads/${lead.id}`}><ChevronRight className="h-4 w-4" /></Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground italic">
                      No enquiry records found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Enquiry?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove the enquiry. This action cannot be undone.</p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
