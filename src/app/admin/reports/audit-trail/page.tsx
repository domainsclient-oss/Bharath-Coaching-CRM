"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Download, History, Search, AlertCircle, CheckCircle, ChevronLeft } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ActionType = "Login" | "Logout" | "Create" | "Update" | "Delete" | "Export" | "Permission Change";
type Severity   = "Info" | "Warning" | "Critical";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: ActionType;
  module: string;
  details: string;
  severity: Severity;
  branchId: string;
}

const FALLBACK_COLOR = "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-800";

const SEVERITY_COLOR: Record<string, string> = {
  Info:     "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800",
  Warning:  "bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800",
  Critical: "bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800",
};

const ACTION_COLOR: Record<string, string> = {
  Login:              "bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800",
  Logout:             "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800",
  Create:             "bg-teal-100 text-teal-700 hover:bg-teal-200 hover:text-teal-800",
  Update:             "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800",
  Delete:             "bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800",
  Export:             "bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800",
  "Permission Change":"bg-orange-100 text-orange-700 hover:bg-orange-200 hover:text-orange-800",
};

export default function AuditTrailPage() {
  const { currentBranch } = useBranch();

  // Load all logs (branchId may be empty for global events like login)
  const { data: allLogs, loading } = useFirestoreCollection<AuditLog>(
    "auditLogs", currentBranch, { filterByBranch: false, orderByField: "createdAt", orderByDir: "desc" }
  );

  // Show logs for this branch OR global events (branchId === "")
  const all = useMemo(() =>
    allLogs.filter(l => !l.branchId || l.branchId === currentBranch || l.branchId === ""),
    [allLogs, currentBranch]
  );

  const [pageSize,   setPageSize]  = useState(50);
  const [search,    setSearch]    = useState("");
  const [actionF,   setActionF]   = useState("All");
  const [severityF, setSeverityF] = useState("All");
  const [moduleF,   setModuleF]   = useState("All");
  const [page,      setPage]      = useState(0);

  const modules = useMemo(() => ["All", ...Array.from(new Set(all.map(l => l.module).filter(Boolean))).sort()], [all]);

  const filtered = useMemo(() =>
    all.filter(l =>
      (actionF   === "All" || l.action   === actionF)   &&
      (severityF === "All" || l.severity === severityF) &&
      (moduleF   === "All" || l.module   === moduleF)   &&
      (l.user?.toLowerCase().includes(search.toLowerCase()) ||
       l.details?.toLowerCase().includes(search.toLowerCase()))
    ), [all, actionF, severityF, moduleF, search]);

  // Reset to first page whenever filters or page size change
  useEffect(() => { setPage(0); }, [search, actionF, severityF, moduleF, pageSize]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStart   = page * pageSize;
  const pageEnd     = Math.min(pageStart + pageSize, filtered.length);
  const paginated   = filtered.slice(pageStart, pageEnd);

  const kpi = useMemo(() => ({
    total:    all.length,
    critical: all.filter(l => l.severity === "Critical").length,
    warnings: all.filter(l => l.severity === "Warning").length,
    logins:   all.filter(l => l.action === "Login").length,
  }), [all]);

  const handleExport = () => {
    const headers = ["#", "Timestamp", "User", "Role", "Action", "Module", "Details", "Severity"];
    const rows = filtered.map((l, i) => [
      i + 1, l.timestamp, `"${l.user}"`, l.role, l.action, l.module, `"${l.details}"`, l.severity,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit-trail.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Audit Log Exported", description: `${filtered.length} events exported.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Audit Trail Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/reports" className="hover:text-[#0D7C8F]">Reports</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Audit Trail</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Events",  value: kpi.total,    color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: History     },
            { label: "Critical",      value: kpi.critical, color: "text-red-600",   bg: "bg-red-100",   icon: AlertCircle },
            { label: "Warnings",      value: kpi.warnings, color: "text-amber-600", bg: "bg-amber-100", icon: ShieldCheck },
            { label: "Login Events",  value: kpi.logins,   color: "text-green-600", bg: "bg-green-100", icon: CheckCircle },
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
                      ? <Skeleton className="h-7 w-10 mt-0.5" />
                      : <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">
              Audit Logs — {filtered.length} total
              {filtered.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (showing {pageStart + 1}–{pageEnd})
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search user / details..." className="pl-8 h-8 text-xs w-48" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={moduleF} onValueChange={setModuleF}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{modules.map(m => <SelectItem key={m} value={m}>{m === "All" ? "All Modules" : m}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={actionF} onValueChange={setActionF}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["All","Login","Logout","Create","Update","Delete","Export","Permission Change"].map(a =>
                    <SelectItem key={a} value={a}>{a === "All" ? "All Actions" : a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={severityF} onValueChange={setSeverityF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["All","Info","Warning","Critical"].map(s => <SelectItem key={s} value={s}>{s === "All" ? "All Severity" : s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
                <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8 bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-1.5"
                onClick={handleExport} disabled={loading || filtered.length === 0}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No audit events yet. Events are recorded automatically on login/logout.
                  </TableCell>
                </TableRow>
              ) : paginated.map((l, i) => (
                <TableRow key={l.id} className={`hover:bg-slate-50/50 ${l.severity === "Critical" ? "bg-red-50/20" : l.severity === "Warning" ? "bg-amber-50/10" : ""}`}>
                  <TableCell className="text-xs text-muted-foreground">{pageStart + i + 1}</TableCell>
                  <TableCell className="text-xs font-mono whitespace-nowrap">{l.timestamp ? new Date(l.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" }) : "—"}</TableCell>
                  <TableCell>
                    <p className="text-sm font-semibold text-[#1E2A4A]">{l.user}</p>
                    <p className="text-[10px] text-muted-foreground">{l.role}</p>
                  </TableCell>
                  <TableCell><Badge className={cn("text-[10px]", ACTION_COLOR[l.action] ?? FALLBACK_COLOR)}>{l.action}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.module}</TableCell>
                  <TableCell className="text-xs max-w-[220px] text-[#1E2A4A]">{l.details}</TableCell>
                  <TableCell><Badge className={cn("text-[10px]", SEVERITY_COLOR[l.severity] ?? FALLBACK_COLOR)}>{l.severity}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination bar */}
          {!loading && filtered.length > pageSize && (
            <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50/60">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages} &nbsp;·&nbsp; {filtered.length} total rows
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev {pageSize}
                </Button>
                <span className="text-xs text-muted-foreground px-1">
                  {pageStart + 1}–{pageEnd}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next {pageSize} <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
