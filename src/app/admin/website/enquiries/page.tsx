"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, MessageSquare, Phone, Mail, Download, Loader2,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
type EnquiryStatus = "New" | "Contacted" | "Converted" | "Closed";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { updateDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface WebsiteEnquiry {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  class?: string;
  subject?: string;
  source?: string;
  message?: string;
  notes?: string;
  status: EnquiryStatus;
  createdAt?: unknown;
  branchId: string;
}

// Sources that come from the website / online channels
const WEBSITE_SOURCES = ["Website", "Google (SEO)", "WhatsApp Button", "Chat Widget", "Website Form"];

const STATUSES: EnquiryStatus[] = ["New", "Contacted", "Converted", "Closed"];
const SOURCES = ["All", ...WEBSITE_SOURCES];

function getDateStr(raw: unknown): string {
  if (!raw) return "—";
  if (typeof raw === "string") return raw;
  if (typeof (raw as { toDate?: () => Date }).toDate === "function") {
    const d = (raw as { toDate: () => Date }).toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return String(raw);
}

const STATUS_STYLE: Record<EnquiryStatus, string> = {
  New:       "bg-blue-100 text-blue-700 border-blue-200",
  Contacted: "bg-amber-100 text-amber-700 border-amber-200",
  Converted: "bg-green-100 text-green-700 border-green-200",
  Closed:    "bg-slate-100 text-slate-500 border-slate-200",
};

const SOURCE_STYLE: Record<string, string> = {
  "Website Form":    "bg-purple-100 text-purple-700",
  "Chat Widget":     "bg-teal-100 text-teal-700",
  "WhatsApp Button": "bg-green-100 text-green-700",
};

export default function EnquiryReportPage() {
  const { currentBranch } = useBranch();

  // Fetch from the shared "enquiries" collection, filter to website-related sources
  const { data: allEnquiries, loading } = useFirestoreCollection<WebsiteEnquiry>(
    "enquiries",
    currentBranch,
    { orderByField: "createdAt", orderByDir: "desc" }
  );

  // Keep only enquiries that originated from website/online channels
  const enquiries = useMemo(
    () => allEnquiries.filter(e => !e.source || WEBSITE_SOURCES.includes(e.source)),
    [allEnquiries]
  );

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");

  const filtered = useMemo(() =>
    enquiries
      .filter(e => statusFilter === "All" || e.status === statusFilter)
      .filter(e => sourceFilter === "All" || e.source === sourceFilter)
      .filter(e => !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.phone ?? "").includes(search)
      ),
    [enquiries, statusFilter, sourceFilter, search],
  );

  const counts = useMemo(() => ({
    total:     enquiries.length,
    new:       enquiries.filter(e => e.status === "New").length,
    converted: enquiries.filter(e => e.status === "Converted").length,
    rate:      enquiries.length > 0
      ? Math.round((enquiries.filter(e => e.status === "Converted").length / enquiries.length) * 100)
      : 0,
  }), [enquiries]);

  const updateStatus = async (id: string, status: EnquiryStatus) => {
    try {
      await updateDocument("enquiries", id, { status });
      toast({ title: "Status Updated", description: `Marked as ${status}.` });
    } catch {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const handleExport = () => {
    const headers = ["Name", "Phone", "Email", "Class", "Subject", "Source", "Status", "Date"];
    const rows = filtered.map(e =>
      [e.name, e.phone ?? "", e.email ?? "", e.class ?? "", e.subject ?? "", e.source ?? "", e.status, getDateStr(e.createdAt)]
        .map(v => `"${v}"`).join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "website-enquiries.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Enquiry Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Website Enquiry Report</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Website Enquiry Report</h2>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Enquiries", value: counts.total,       color: "text-[#1E2A4A]" },
            { label: "New",             value: counts.new,         color: "text-blue-600" },
            { label: "Converted",       value: counts.converted,   color: "text-green-600" },
            { label: "Conversion Rate", value: `${counts.rate}%`,  color: "text-amber-600" },
          ].map(c => (
            <Card key={c.label} className="border-none shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                {loading
                  ? <Skeleton className="h-7 w-12 mt-1" />
                  : <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                }
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status pill filters */}
        <div className="flex flex-wrap gap-2">
          {["All", ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                statusFilter === s
                  ? "bg-[#1E2A4A] text-white border-[#1E2A4A]"
                  : "bg-white text-muted-foreground border-slate-200 hover:border-slate-400"
              }`}
            >
              {s}{s !== "All" && !loading && ` (${enquiries.filter(e => e.status === s).length})`}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex flex-wrap gap-3">
            <Input
              className="flex-1 min-w-52"
              placeholder="Search name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCES.map(s => <SelectItem key={s} value={s}>{s === "All" ? "All Sources" : s}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            {loading
              ? <Skeleton className="h-5 w-28" />
              : <CardTitle className="text-base">{filtered.length} Enquiries</CardTitle>
            }
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Class / Subject</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className="h-8 w-8 opacity-20" />
                      <p>No enquiries found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map(e => (
                <TableRow key={e.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium text-sm text-[#1E2A4A]">{e.name}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {e.phone ?? "—"}
                      </div>
                      {e.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {e.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{e.class ?? "—"}{e.subject ? ` • ${e.subject}` : ""}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${SOURCE_STYLE[e.source] ?? "bg-slate-100 text-slate-600"}`}>{e.source}</Badge>
                  </TableCell>
                  <TableCell>
                    {e.message
                      ? <span className="text-xs text-muted-foreground line-clamp-1 max-w-40">{e.message}</span>
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-xs ${STATUS_STYLE[e.status]}`}>{e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{getDateStr(e.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Select value={e.status} onValueChange={v => updateStatus(e.id, v as EnquiryStatus)}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

      </main>
    </div>
  );
}
