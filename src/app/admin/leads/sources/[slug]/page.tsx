"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight, PhoneCall, User, MessageSquare,
  ArrowLeft, PlusCircle, Search,
} from "lucide-react";
import { useState } from "react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUSES, SOURCE_COLORS, LeadStatus } from "@/data/leadsData";
import { SOURCE_SLUGS } from "../page";
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
  classInterested?: string;
  board?: string;
  subjects?: string[];
  assignedTo?: string;
  followUpDate?: string;
  referredBy?: string;
  source?: string;
  status: LeadStatus;
  branchId: string;
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  "New": "bg-slate-100 text-slate-700 hover:bg-slate-100",
  "Contacted": "bg-blue-100 text-blue-700 hover:bg-blue-100",
  "Interested": "bg-amber-100 text-amber-700 hover:bg-amber-100",
  "Demo Scheduled": "bg-purple-100 text-purple-700 hover:bg-purple-100",
  "Admitted": "bg-green-100 text-green-700 hover:bg-green-100",
  "Not Interested": "bg-red-100 text-red-700 hover:bg-red-100",
};

const SOURCE_ICONS: Record<string, string> = {
  "Walk-in": "🚶",
  "Phone Call": "📞",
  "WhatsApp Enquiry": "💬",
  "Social Media": "📱",
  "Student Referral": "👥",
  "School Reference": "🏫",
  "Banner / Sunpack": "🪧",
  "Pamphlet": "📄",
  "Google (SEO)": "🔍",
  "Website": "🌐",
  "Old Students": "🎓",
};

export default function LeadSourceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { currentBranch } = useBranch();

  const source = SOURCE_SLUGS[slug];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const { data: allData } = useFirestoreCollection<LeadDoc>("enquiries", currentBranch);

  const allLeads = useMemo(() =>
    allData.filter(l => l.source === source),
    [allData, source]
  );

  const filtered = useMemo(() => allLeads.filter(l =>
    (statusFilter === "All" || l.status === statusFilter) &&
    (
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.enquiryNo ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.parentName ?? "").toLowerCase().includes(search.toLowerCase())
    )
  ), [allLeads, statusFilter, search]);

  // Status breakdown counts
  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    LEAD_STATUSES.forEach(s => { map[s] = 0; });
    allLeads.forEach(l => { map[l.status] = (map[l.status] || 0) + 1; });
    return map;
  }, [allLeads]);

  if (!source) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F7FA] items-center justify-center">
        <p className="text-muted-foreground">Unknown lead source.</p>
        <Link href="/admin/leads/sources" className="text-[#0D7C8F] text-sm mt-2">← Back to Sources</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title={source} />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/leads" className="hover:text-[#0D7C8F]">Leads</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/leads/sources" className="hover:text-[#0D7C8F]">Lead Sources</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">{source}</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/leads/sources">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h2 className="text-2xl font-bold text-[#1E2A4A]">
              {SOURCE_ICONS[source]} {source}
            </h2>
            <Badge className={`${SOURCE_COLORS[source]} text-sm`}>{allLeads.length} enquiries</Badge>
          </div>
          <Link href="/admin/leads/add">
            <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
              <PlusCircle className="h-4 w-4" /> Add Enquiry
            </Button>
          </Link>
        </div>

        {/* Status breakdown cards */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {LEAD_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "All" : status)}
              className={cn(
                "rounded-xl p-3 text-left transition-all border-2",
                statusFilter === status
                  ? "border-[#0D7C8F] bg-white shadow-md"
                  : "border-transparent bg-white shadow-sm hover:shadow-md"
              )}
            >
              <p className="text-xl font-bold text-[#1E2A4A]">{statusCounts[status]}</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">{status}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, enquiry no, parent..."
                  className="pl-10"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-52">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  {LEAD_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">
              {filtered.length} {filtered.length === 1 ? "Enquiry" : "Enquiries"}
              {statusFilter !== "All" && <span className="text-muted-foreground font-normal"> · {statusFilter}</span>}
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Enquiry No</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class / Board</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Follow Up</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? filtered.map(lead => (
                <TableRow key={lead.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-mono text-xs text-muted-foreground">{lead.enquiryNo || "—"}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-sm text-[#1E2A4A]">{lead.name}</p>
                      {lead.parentName && <p className="text-xs text-muted-foreground">P: {lead.parentName}</p>}
                      {lead.referredBy && (
                        <p className="text-xs text-purple-600 mt-0.5">Ref: {lead.referredBy}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{lead.classInterested ? `Class ${lead.classInterested}` : "—"}</div>
                    {lead.board && <Badge variant="outline" className="text-xs mt-0.5">{lead.board}</Badge>}
                  </TableCell>
                  <TableCell className="text-sm">{lead.phone || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(lead.subjects ?? []).map(s => (
                        <Badge key={s} variant="secondary" className="text-xs py-0">{s}</Badge>
                      ))}
                      {!lead.subjects?.length && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{lead.assignedTo || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{lead.followUpDate || "—"}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${STATUS_COLORS[lead.status]}`}>{lead.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-[#0D7C8F] hover:bg-[#0D7C8F] hover:text-white" title="Call"
                        disabled={!lead.phone}
                        onClick={() => lead.phone && window.open(`tel:${lead.phone}`, "_self")}
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-600 hover:text-white" title="WhatsApp"
                        disabled={!lead.whatsapp && !lead.phone}
                        onClick={() => {
                          const num = (lead.whatsapp || lead.phone || "").replace(/\D/g, "");
                          window.open(`https://wa.me/${num}`, "_blank");
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                      <Link href={`/admin/leads/${lead.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-600 hover:text-white" title="View">
                          <User className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No {source} enquiries found{statusFilter !== "All" ? ` with status "${statusFilter}"` : ""}.
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
