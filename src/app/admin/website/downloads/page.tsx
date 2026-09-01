"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Download, TrendingUp, FileText, BarChart3 } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { UploadCategory } from "@/data/websiteData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";

interface WebsiteUpload {
  id: string;
  title: string;
  category: UploadCategory;
  subject: string;
  class: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  uploadedAt: string;
  isPublic: boolean;
  downloadCount: number;
  downloadUrl?: string;
  branchId: string;
}

const CAT_COLORS: Record<UploadCategory, string> = {
  "Notes":       "bg-blue-100 text-blue-700",
  "Past Papers": "bg-purple-100 text-purple-700",
  "Worksheets":  "bg-teal-100 text-teal-700",
  "Syllabus":    "bg-amber-100 text-amber-700",
  "Other":       "bg-slate-100 text-slate-600",
};

export default function DownloadReportPage() {
  const { currentBranch } = useBranch();

  const { data: allUploads, loading } = useFirestoreCollection<WebsiteUpload>("websiteUploads", currentBranch);

  const uploads = useMemo(
    () => allUploads.filter(u => u.isPublic),
    [allUploads],
  );

  const sorted = useMemo(
    () => [...uploads].sort((a, b) => (b.downloadCount ?? 0) - (a.downloadCount ?? 0)),
    [uploads],
  );

  const totalDownloads = uploads.reduce((s, u) => s + (u.downloadCount ?? 0), 0);
  const avgDownloads   = uploads.length > 0 ? Math.round(totalDownloads / uploads.length) : 0;
  const topMaterial    = sorted[0]?.title ?? "—";
  const maxDownloads   = sorted[0]?.downloadCount ?? 1;

  const categoryBreakdown = useMemo(() => {
    const map: Partial<Record<UploadCategory, number>> = {};
    uploads.forEach(u => {
      map[u.category] = (map[u.category] ?? 0) + (u.downloadCount ?? 0);
    });
    return Object.entries(map)
      .map(([cat, count]) => ({ cat: cat as UploadCategory, count: count ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [uploads]);

  const maxCatCount = Math.max(...categoryBreakdown.map(c => c.count), 1);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Download Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Download Report</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">Download Report</h2>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Downloads", value: totalDownloads.toLocaleString(), color: "text-[#0D7C8F]", icon: Download },
            { label: "Public Materials", value: uploads.length,                 color: "text-[#1E2A4A]", icon: FileText },
            { label: "Avg per Material", value: avgDownloads,                   color: "text-green-600",  icon: TrendingUp },
            { label: "Top Material",     value: "—",                            color: "text-amber-600",  icon: BarChart3, sub: topMaterial },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    {loading
                      ? <Skeleton className="h-6 w-12 mt-1" />
                      : c.sub
                        ? <p className={`text-xs font-bold truncate ${c.color}`}>{c.sub}</p>
                        : <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Category chart */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#0D7C8F]" /> Downloads by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
            ) : categoryBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No public uploads yet.</p>
            ) : categoryBreakdown.map(c => (
              <div key={c.cat} className="flex items-center gap-3">
                <Badge className={`text-xs w-28 justify-center ${CAT_COLORS[c.cat]}`}>{c.cat}</Badge>
                <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-[#0D7C8F] rounded-full transition-all"
                    style={{ width: `${Math.round((c.count / maxCatCount) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-[#1E2A4A] w-12 text-right">
                  {c.count.toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">Material-wise Download Count</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Class / Subject</TableHead>
                <TableHead className="text-right">Downloads</TableHead>
                <TableHead>Popularity</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No public uploads found. Add uploads from the Uploads page.
                  </TableCell>
                </TableRow>
              ) : sorted.map((u, idx) => {
                const pct = Math.round(((u.downloadCount ?? 0) / maxDownloads) * 100);
                return (
                  <TableRow key={u.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-xs text-muted-foreground font-bold">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          {u.downloadUrl
                            ? <a href={u.downloadUrl} target="_blank" rel="noreferrer" className="font-medium text-sm text-[#0D7C8F] hover:underline">{u.title}</a>
                            : <p className="font-medium text-sm text-[#1E2A4A]">{u.title}</p>
                          }
                          <p className="text-xs text-muted-foreground">{u.fileName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${CAT_COLORS[u.category] ?? "bg-slate-100 text-slate-600"}`}>{u.category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{u.class} • {u.subject}</TableCell>
                    <TableCell className="text-right font-bold text-[#0D7C8F]">{(u.downloadCount ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-24">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-[#0D7C8F] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.uploadedAt}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

      </main>
    </div>
  );
}
