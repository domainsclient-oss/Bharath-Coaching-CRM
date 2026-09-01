"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight, Download, TrendingUp, Users, UserCheck,
  UserX, BarChart3,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { LeadSource, LeadStatus, LEAD_STATUSES, SOURCE_COLORS } from "@/data/leadsData";
import { SOURCE_SLUGS } from "../sources/page";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { toast } from "@/hooks/use-toast";

interface LeadDoc {
  id: string;
  source?: string;
  status: LeadStatus;
  createdAt?: string;
  branchId: string;
}

const SOURCE_ICONS: Record<string, string> = {
  "Walk-in": "🚶", "Phone Call": "📞", "WhatsApp Enquiry": "💬",
  "Social Media": "📱", "Student Referral": "👥", "School Reference": "🏫",
  "Banner / Sunpack": "🪧", "Pamphlet": "📄", "Google (SEO)": "🔍",
  "Website": "🌐", "Old Students": "🎓",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  "New": "bg-slate-400",
  "Contacted": "bg-blue-400",
  "Interested": "bg-amber-400",
  "Demo Scheduled": "bg-purple-400",
  "Admitted": "bg-green-500",
  "Not Interested": "bg-red-400",
};

const ALL_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getDateStr(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (typeof (raw as { toDate?: () => Date }).toDate === "function") {
    const d = (raw as { toDate: () => Date }).toDate();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  return String(raw);
}

export default function LeadDetailedReportPage() {
  const { currentBranch } = useBranch();
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));

  const { data: leads } = useFirestoreCollection<LeadDoc>("enquiries", currentBranch);

  const yearLeads = useMemo(() =>
    leads.filter(l => getDateStr(l.createdAt).startsWith(yearFilter)),
    [leads, yearFilter]
  );

  // Summary KPIs
  const total = yearLeads.length;
  const admitted = yearLeads.filter(l => l.status === "Admitted").length;
  const notInterested = yearLeads.filter(l => l.status === "Not Interested").length;
  const active = total - admitted - notInterested;
  const conversionRate = total ? Math.round((admitted / total) * 100) : 0;

  // Source-wise stats
  const sourceStats = useMemo(() => {
    const allSources = Object.values(SOURCE_SLUGS) as LeadSource[];
    return allSources.map(source => {
      const sl = yearLeads.filter(l => l.source === source);
      const adm = sl.filter(l => l.status === "Admitted").length;
      const ni = sl.filter(l => l.status === "Not Interested").length;
      const activeCount = sl.length - adm - ni;
      return {
        source,
        total: sl.length,
        admitted: adm,
        active: activeCount,
        notInterested: ni,
        conversionRate: sl.length ? Math.round((adm / sl.length) * 100) : 0,
      };
    }).sort((a, b) => b.total - a.total);
  }, [yearLeads]);

  const maxSourceTotal = Math.max(...sourceStats.map(s => s.total), 1);

  // Status distribution
  const statusDist = useMemo(() => {
    return LEAD_STATUSES.map(status => ({
      status,
      count: yearLeads.filter(l => l.status === status).length,
    }));
  }, [yearLeads]);

  // Month-wise trend
  const monthTrend = useMemo(() => {
    return ALL_MONTHS.map((month, idx) => {
      const prefix = `${yearFilter}-${String(idx + 1).padStart(2, "0")}`;
      const ml = yearLeads.filter(l => getDateStr(l.createdAt).startsWith(prefix));
      return {
        month,
        total: ml.length,
        admitted: ml.filter(l => l.status === "Admitted").length,
      };
    });
  }, [yearLeads, yearFilter]);

  const maxMonthTotal = Math.max(...monthTrend.map(m => m.total), 1);

  const handleExport = () => {
    const headers = ["Source", "Total", "New", "Contacted", "Interested", "Demo Scheduled", "Admitted", "Not Interested", "Conversion %"];
    const rows = sourceStats.map(s => {
      const statusWise = LEAD_STATUSES.reduce((acc, status) => {
        acc[status] = yearLeads.filter(l => l.source === s.source && l.status === status).length;
        return acc;
      }, {} as Record<string, number>);
      return [
        s.source, s.total,
        statusWise["New"], statusWise["Contacted"], statusWise["Interested"],
        statusWise["Demo Scheduled"], statusWise["Admitted"], statusWise["Not Interested"],
        `${s.conversionRate}%`,
      ];
    });
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-report-${yearFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `Lead report for ${yearFilter} exported as CSV.` });
  };

  const availableYears = useMemo(() => {
    const current = String(new Date().getFullYear());
    const fromData = leads.map(l => getDateStr(l.createdAt).slice(0, 4)).filter(y => y.length === 4);
    const years = new Set([current, ...fromData]);
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [leads]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Lead Detailed Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/leads" className="hover:text-[#0D7C8F]">Leads</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Detailed Report</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Lead Sources — Detailed Report</h2>
          <div className="flex items-center gap-3">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={handleExport} disabled={sourceStats.every(s => s.total === 0)}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Enquiries</p>
                <p className="text-2xl font-bold text-[#1E2A4A]">{total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Leads</p>
                <p className="text-2xl font-bold text-[#1E2A4A]">{active}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Admitted</p>
                <p className="text-2xl font-bold text-green-600">{admitted}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-gradient-to-br from-[#1E2A4A] to-[#0D7C8F] text-white">
            <CardContent className="p-4">
              <p className="text-xs text-white/60">Conversion Rate</p>
              <p className="text-2xl font-bold mt-1">{conversionRate}%</p>
              <p className="text-xs text-white/50 mt-0.5">{admitted} of {total} admitted</p>
            </CardContent>
          </Card>
        </div>

        {/* Source-wise Bar Chart + Table */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Visual bar chart */}
          <Card className="border-none shadow-sm lg:col-span-2">
            <CardHeader className="border-b py-3 px-5">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#0D7C8F]" /> Enquiries by Source
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {sourceStats.filter(s => s.total > 0).map(s => (
                <div key={s.source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[#1E2A4A] flex items-center gap-1">
                      <span>{SOURCE_ICONS[s.source]}</span>
                      <span className="truncate max-w-[130px]">{s.source}</span>
                    </span>
                    <span className="text-xs font-bold text-[#0D7C8F]">{s.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0D7C8F] transition-all"
                      style={{ width: `${(s.total / maxSourceTotal) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="text-green-600">{s.admitted} admitted</span>
                    <span>·</span>
                    <span className="text-blue-600">{s.active} active</span>
                    <span>·</span>
                    <span className="font-semibold text-[#0D7C8F]">{s.conversionRate}%</span>
                  </div>
                </div>
              ))}
              {sourceStats.every(s => s.total === 0) && (
                <p className="text-center text-muted-foreground text-sm py-4">No data for {yearFilter}</p>
              )}
            </CardContent>
          </Card>

          {/* Month-wise trend */}
          <Card className="border-none shadow-sm lg:col-span-3">
            <CardHeader className="border-b py-3 px-5">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0D7C8F]" /> Month-wise Trend — {yearFilter}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-end gap-1.5 h-36">
                {monthTrend.map(({ month, total: mt, admitted: ma }) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex flex-col justify-end h-28 gap-0.5">
                      {mt > 0 ? (
                        <>
                          <div
                            className="w-full rounded-t bg-green-400 transition-all"
                            style={{ height: `${(ma / maxMonthTotal) * 100}%` }}
                            title={`${ma} admitted`}
                          />
                          <div
                            className="w-full bg-[#0D7C8F]"
                            style={{ height: `${((mt - ma) / maxMonthTotal) * 100}%` }}
                            title={`${mt - ma} other`}
                          />
                        </>
                      ) : (
                        <div className="w-full bg-slate-100 rounded" style={{ height: "4px" }} />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{month}</span>
                    {mt > 0 && (
                      <span className="text-[10px] font-bold text-[#1E2A4A]">{mt}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-[#0D7C8F]" /> Enquiries
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-green-400" /> Admitted
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Source-wise detail table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">Source-wise Breakdown</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">New</TableHead>
                <TableHead className="text-center">Contacted</TableHead>
                <TableHead className="text-center">Interested</TableHead>
                <TableHead className="text-center">Demo</TableHead>
                <TableHead className="text-center">Admitted</TableHead>
                <TableHead className="text-center">Not Interested</TableHead>
                <TableHead className="text-center">Conversion</TableHead>
                <TableHead>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourceStats.map(s => {
                const slug = Object.entries(SOURCE_SLUGS).find(([, v]) => v === s.source)?.[0];
                const statusWise = LEAD_STATUSES.reduce((acc, status) => {
                  acc[status] = yearLeads.filter(l => l.source === s.source && l.status === status).length;
                  return acc;
                }, {} as Record<string, number>);

                return (
                  <TableRow key={s.source} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{SOURCE_ICONS[s.source]}</span>
                        <div>
                          <p className="font-semibold text-sm text-[#1E2A4A]">{s.source}</p>
                          <Badge className={`text-xs mt-0.5 ${SOURCE_COLORS[s.source as LeadSource]}`}>
                            {s.total} total
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold">{s.total}</TableCell>
                    <TableCell className="text-center text-slate-600">{statusWise["New"]}</TableCell>
                    <TableCell className="text-center text-blue-600">{statusWise["Contacted"]}</TableCell>
                    <TableCell className="text-center text-amber-600">{statusWise["Interested"]}</TableCell>
                    <TableCell className="text-center text-purple-600">{statusWise["Demo Scheduled"]}</TableCell>
                    <TableCell className="text-center font-bold text-green-600">{statusWise["Admitted"]}</TableCell>
                    <TableCell className="text-center text-red-500">{statusWise["Not Interested"]}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-[#0D7C8F]">{s.conversionRate}%</span>
                        <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#0D7C8F]"
                            style={{ width: `${s.conversionRate}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {slug && (
                        <Link
                          href={`/admin/leads/sources/${slug}`}
                          className="text-xs text-[#0D7C8F] hover:underline font-semibold"
                        >
                          View →
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Status distribution */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b py-3 px-6">
            <CardTitle className="text-base">Status Distribution — All Sources</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statusDist.map(({ status, count }) => (
                <div key={status} className="text-center">
                  <div className={`h-2 rounded-full mb-3 ${STATUS_COLORS[status as LeadStatus]}`} />
                  <p className="text-2xl font-bold text-[#1E2A4A]">{count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{status}</p>
                  <p className="text-xs font-semibold text-[#0D7C8F] mt-0.5">
                    {total ? Math.round((count / total) * 100) : 0}%
                  </p>
                </div>
              ))}
            </div>
            {/* Full-width stacked bar */}
            {total > 0 && (
              <div className="mt-5 h-3 rounded-full overflow-hidden flex">
                {statusDist.map(({ status, count }) => (
                  count > 0 && (
                    <div
                      key={status}
                      className={`h-full ${STATUS_COLORS[status as LeadStatus]} transition-all`}
                      style={{ width: `${(count / total) * 100}%` }}
                      title={`${status}: ${count}`}
                    />
                  )
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
