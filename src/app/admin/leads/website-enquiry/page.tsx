"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Search, PhoneCall, MessageSquare,
  Globe, Mail, User, PlusCircle, Filter,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LEAD_STATUSES, LeadStatus } from "@/data/leadsData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { cn } from "@/lib/utils";

interface LeadDoc {
  id: string;
  enquiryNo?: string;
  name: string;
  parentName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  classInterested?: string;
  board?: string;
  subjects?: string[];
  mode?: string;
  source?: string;
  status: LeadStatus;
  followUpDate?: string;
  branchId: string;
}

const STATUS_COLORS: Record<string, string> = {
  "New":           "bg-slate-100 text-slate-700 hover:bg-slate-100",
  "Contacted":     "bg-blue-100 text-blue-700 hover:bg-blue-100",
  "Interested":    "bg-amber-100 text-amber-700 hover:bg-amber-100",
  "Demo Scheduled":"bg-purple-100 text-purple-700 hover:bg-purple-100",
  "Admitted":      "bg-green-100 text-green-700 hover:bg-green-100",
  "Not Interested":"bg-red-100 text-red-700 hover:bg-red-100",
};

export default function WebsiteEnquiryPage() {
  const { currentBranch } = useBranch();
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [classFilter, setClassFilter]   = useState("All");
  const [boardFilter, setBoardFilter]   = useState("All");
  const { data: allData } = useFirestoreCollection<LeadDoc>("enquiries", currentBranch);
  const allLeads = useMemo(() => allData.filter(l => l.source === "Website"), [allData]);


  // Dynamic class options from data
  const classOptions = useMemo(() =>
    ["All", ...Array.from(new Set(allLeads.map(l => l.classInterested).filter(Boolean))).sort()],
    [allLeads]
  );

  const filtered = useMemo(() =>
    allLeads.filter(l =>
      (statusFilter === "All" || l.status === statusFilter) &&
      (classFilter === "All" || l.classInterested === classFilter) &&
      (boardFilter === "All" || l.board === boardFilter) &&
      (
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        (l.enquiryNo ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (l.email ?? "").toLowerCase().includes(search.toLowerCase())
      )
    ),
    [allLeads, statusFilter, classFilter, boardFilter, search]
  );

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    LEAD_STATUSES.forEach(s => { map[s] = 0; });
    allLeads.forEach(l => { map[l.status] = (map[l.status] || 0) + 1; });
    return map;
  }, [allLeads]);

  const admitted = allLeads.filter(l => l.status === "Admitted").length;
  const conversionRate = allLeads.length ? Math.round((admitted / allLeads.length) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Website Enquiry" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/leads" className="hover:text-[#0D7C8F]">Leads</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Website Enquiry</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Globe className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1E2A4A]">Website Enquiry</h2>
              <p className="text-xs text-muted-foreground">Leads from the website contact form</p>
            </div>
          </div>
          <Link href="/admin/leads/add">
            <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
              <PlusCircle className="h-4 w-4" /> Add Enquiry
            </Button>
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Enquiries</p>
              <p className="text-2xl font-bold text-[#1E2A4A]">{allLeads.length}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">New / Pending</p>
              <p className="text-2xl font-bold text-amber-600">
                {(statusCounts["New"] ?? 0) + (statusCounts["Contacted"] ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Admitted</p>
              <p className="text-2xl font-bold text-green-600">{admitted}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold text-[#0D7C8F]">{conversionRate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("All")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold border transition-colors",
              statusFilter === "All"
                ? "bg-[#1E2A4A] text-white border-[#1E2A4A]"
                : "bg-white text-slate-600 border-slate-200 hover:border-[#0D7C8F]"
            )}
          >
            All ({allLeads.length})
          </button>
          {LEAD_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "All" : s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold border transition-colors",
                statusFilter === s
                  ? "bg-[#0D7C8F] text-white border-[#0D7C8F]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#0D7C8F]"
              )}
            >
              {s} ({statusCounts[s] ?? 0})
            </button>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Name, enquiry no, email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  {classOptions.map(c => (
                    <SelectItem key={c} value={c!}>{c === "All" ? "All Classes" : `Class ${c}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={boardFilter} onValueChange={setBoardFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All Boards" /></SelectTrigger>
                <SelectContent>
                  {["All", "CBSE", "ICSE", "State", "Samacheer", "IB"].map(b => (
                    <SelectItem key={b} value={b}>{b === "All" ? "All Boards" : b}</SelectItem>
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
              {filtered.length} Enquir{filtered.length !== 1 ? "ies" : "y"}
              {statusFilter !== "All" && (
                <span className="text-muted-foreground font-normal"> · {statusFilter}</span>
              )}
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Enquiry No</TableHead>
                  <TableHead>Student / Parent</TableHead>
                  <TableHead>Class / Board</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Follow Up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? filtered.map(lead => (
                  <TableRow key={lead.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {lead.enquiryNo || "—"}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-sm text-[#1E2A4A]">{lead.name}</p>
                      {lead.parentName && <p className="text-xs text-muted-foreground">P: {lead.parentName}</p>}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{lead.classInterested ? `Class ${lead.classInterested}` : "—"}</p>
                      {lead.board && <Badge variant="outline" className="text-xs mt-0.5">{lead.board}</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[130px]">
                        {(lead.subjects ?? []).map(s => (
                          <Badge key={s} variant="secondary" className="text-xs py-0">{s}</Badge>
                        ))}
                        {!lead.subjects?.length && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{lead.mode || "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lead.email ? (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{lead.email}</span>
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{lead.followUpDate || "—"}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", STATUS_COLORS[lead.status] ?? "bg-slate-100 text-slate-700")}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          title="Call"
                          disabled={!lead.phone}
                          onClick={() => lead.phone && window.open(`tel:${lead.phone}`, "_self")}
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                          title="WhatsApp"
                          disabled={!lead.whatsapp && !lead.phone}
                          onClick={() => {
                            const num = (lead.whatsapp || lead.phone || "").replace(/\D/g, "");
                            window.open(`https://wa.me/${num}`, "_blank");
                          }}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                        <Link href={`/admin/leads/${lead.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-700" title="View">
                            <User className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Globe className="h-8 w-8 opacity-20" />
                        <p>No website enquiries found{statusFilter !== "All" ? ` with status "${statusFilter}"` : ""}.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
}
