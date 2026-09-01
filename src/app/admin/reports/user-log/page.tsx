"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, History, Download, Search,
  LogIn, LogOut, Users, Clock, Wifi,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: string;
  details: string;
  severity: string;
  branchId: string;
}

const ROLE_FALLBACK_COLOR = "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-800";

const ROLE_COLOR: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800",
  admin:       "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800",
  teacher:     "bg-teal-100 text-teal-700 hover:bg-teal-200 hover:text-teal-800",
  student:     "bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800",
};

function formatDuration(ms: number): string {
  if (ms < 0) return "—";
  const m = Math.floor(ms / 60000);
  if (m < 1)  return "< 1 min";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function UserLogPage() {
  const { currentBranch } = useBranch();

  const { data: allLogs, loading } = useFirestoreCollection<AuditLog>(
    "auditLogs",
    null,
    { filterByBranch: false, orderByField: "createdAt", orderByDir: "desc" }
  );

  const today     = localDateStr(new Date());
  const weekStart = localDateStr(new Date(Date.now() - 6 * 86400000));

  const [search,   setSearch]   = useState("");
  const [roleF,    setRoleF]    = useState("All");
  const [actionF,  setActionF]  = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [rangePreset, setRangePreset] = useState("all");

  // Apply preset
  const effectiveFrom = rangePreset === "today" ? today
    : rangePreset === "week"  ? weekStart
    : rangePreset === "custom" ? dateFrom
    : "";
  const effectiveTo = rangePreset === "custom" ? dateTo : "";

  // Only Login/Logout events
  const loginLogs = useMemo(() =>
    allLogs.filter(l => l.action === "Login" || l.action === "Logout"),
    [allLogs]
  );

  const roles = useMemo(() =>
    ["All", ...Array.from(new Set(loginLogs.map(l => l.role).filter(Boolean))).sort()],
    [loginLogs]
  );

  const filtered = useMemo(() =>
    loginLogs.filter(l => {
      const ts = l.timestamp?.slice(0, 10) ?? "";
      return (
        (roleF   === "All" || l.role   === roleF)   &&
        (actionF === "All" || l.action === actionF) &&
        (!effectiveFrom || ts >= effectiveFrom) &&
        (!effectiveTo   || ts <= effectiveTo)   &&
        (!search || l.user?.toLowerCase().includes(search.toLowerCase()))
      );
    }),
    [loginLogs, roleF, actionF, effectiveFrom, effectiveTo, search]
  );

  // Session pairing: for each Login find the next Logout by same user
  const sessions = useMemo(() => {
    const byUser: Record<string, AuditLog[]> = {};
    loginLogs.forEach(l => {
      if (!byUser[l.user]) byUser[l.user] = [];
      byUser[l.user].push(l);
    });

    const result: Array<{
      user: string; role: string;
      loginAt: string; logoutAt: string | null; duration: number;
    }> = [];

    Object.entries(byUser).forEach(([user, events]) => {
      const sorted = [...events].sort((a, b) => a.timestamp?.localeCompare(b.timestamp ?? "") ?? 0);
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].action !== "Login") continue;
        const loginTime = sorted[i].timestamp;
        const nextLogout = sorted.slice(i + 1).find(e => e.action === "Logout");
        const logoutTime = nextLogout?.timestamp ?? null;
        const duration = logoutTime
          ? new Date(logoutTime).getTime() - new Date(loginTime).getTime()
          : -1;
        result.push({ user, role: sorted[i].role, loginAt: loginTime, logoutAt: logoutTime, duration });
      }
    });

    return result.sort((a, b) => b.loginAt?.localeCompare(a.loginAt) ?? 0);
  }, [loginLogs]);

  const kpi = useMemo(() => {
    const uniqueUsers  = new Set(loginLogs.map(l => l.user)).size;
    const logins       = loginLogs.filter(l => l.action === "Login").length;
    const logouts      = loginLogs.filter(l => l.action === "Logout").length;
    const activeNow    = logins - logouts > 0 ? logins - logouts : 0;
    return { total: loginLogs.length, uniqueUsers, logins, logouts, activeNow };
  }, [loginLogs]);

  const handleExport = () => {
    const headers = ["#", "Timestamp", "User", "Role", "Action", "Details"];
    const rows = filtered.map((l, i) => [
      i + 1,
      l.timestamp ? new Date(l.timestamp).toLocaleString("en-IN") : "—",
      `"${l.user}"`, l.role, l.action, `"${l.details ?? ""}"`,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "user-log.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "User Log Exported", description: `${filtered.length} events exported.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="User Log" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/reports" className="hover:text-[#0D7C8F]">Reports</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">User Log</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">User Activity Log</h2>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Events",  value: kpi.total,       color: "text-[#1E2A4A]",  bg: "bg-blue-100",   icon: History  },
            { label: "Unique Users",  value: kpi.uniqueUsers, color: "text-purple-600", bg: "bg-purple-100", icon: Users    },
            { label: "Logins",        value: kpi.logins,      color: "text-green-600",  bg: "bg-green-100",  icon: LogIn    },
            { label: "Logouts",       value: kpi.logouts,     color: "text-slate-600",  bg: "bg-slate-100",  icon: LogOut   },
            { label: "Active Now",    value: kpi.activeNow,   color: "text-teal-600",   bg: "bg-teal-100",   icon: Wifi     },
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

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              {/* Search */}
              <div className="relative min-w-[180px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search user..."
                  className="pl-8 h-9 text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Role */}
              <Select value={roleF} onValueChange={setRoleF}>
                <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="All Roles" /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => <SelectItem key={r} value={r}>{r === "All" ? "All Roles" : r}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Action */}
              <Select value={actionF} onValueChange={setActionF}>
                <SelectTrigger className="w-32 h-9 text-sm"><SelectValue placeholder="All Actions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Actions</SelectItem>
                  <SelectItem value="Login">Login</SelectItem>
                  <SelectItem value="Logout">Logout</SelectItem>
                </SelectContent>
              </Select>

              {/* Date range preset */}
              <Select value={rangePreset} onValueChange={setRangePreset}>
                <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {rangePreset === "custom" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input type="date" className="h-9 text-sm w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input type="date" className="h-9 text-sm w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} max={today} />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session summary table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6 flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm font-bold text-[#1E2A4A] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#0D7C8F]" />
              Session History
              <span className="text-muted-foreground font-normal text-xs ml-1">
                ({sessions.length} session{sessions.length !== 1 ? "s" : ""})
              </span>
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Login Time</TableHead>
                  <TableHead>Logout Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                    </TableRow>
                  ))
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-sm">
                      No sessions recorded yet. Events are logged automatically on login and logout.
                    </TableCell>
                  </TableRow>
                ) : sessions.map((s, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/50">
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-semibold text-sm text-[#1E2A4A]">{s.user}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px]", ROLE_COLOR[s.role] ?? ROLE_FALLBACK_COLOR)}>{s.role}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono whitespace-nowrap">
                      {s.loginAt ? new Date(s.loginAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" }) : "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono whitespace-nowrap text-muted-foreground">
                      {s.logoutAt ? new Date(s.logoutAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" }) : "—"}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {s.duration >= 0 ? formatDuration(s.duration) : "—"}
                    </TableCell>
                    <TableCell>
                      {s.logoutAt
                        ? <Badge className="bg-slate-100 text-slate-600 text-[10px] hover:bg-slate-100">Ended</Badge>
                        : <Badge className="bg-green-100 text-green-700 text-[10px] hover:bg-green-100">Active</Badge>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Raw event log */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6 flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">
              Raw Events — {filtered.length}
            </CardTitle>
            <Button
              size="sm" className="h-8 bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-1.5"
              onClick={handleExport}
              disabled={loading || filtered.length === 0}
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                      No events match the current filters.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((l, i) => (
                  <TableRow key={l.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="text-xs font-mono whitespace-nowrap">
                      {l.timestamp ? new Date(l.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" }) : "—"}
                    </TableCell>
                    <TableCell className="font-semibold text-sm text-[#1E2A4A]">{l.user}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px]", ROLE_COLOR[l.role] ?? ROLE_FALLBACK_COLOR)}>{l.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px]", l.action === "Login"
                        ? "bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800")}>
                        {l.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.details ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

      </main>
    </div>
  );
}
