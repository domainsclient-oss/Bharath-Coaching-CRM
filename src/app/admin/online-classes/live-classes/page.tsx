"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Video, ExternalLink, Copy, Search,
  ClipboardCheck, Plus, RefreshCw,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { updateDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface OnlineClassDoc {
  id: string;
  title: string;
  class: string;
  subject: string;
  teacherName?: string;
  date: string;
  time: string;
  duration?: number;
  meetLink?: string;
  status: "Scheduled" | "Live" | "Ended";
  branchId: string;
}

function generateMeetLink() {
  const seg = () => Math.random().toString(36).substring(2, 5);
  return `https://meet.google.com/${seg()}-${seg()}${seg()}-${seg()}`;
}

export default function LiveClassesPage() {
  const { currentBranch } = useBranch();
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [classFilter, setClassFilter]   = useState("All");

  const { data: sessions } = useFirestoreCollection<OnlineClassDoc>("onlineClasses", currentBranch);

  // Unique class names for filter dropdown
  const classOptions = useMemo(() =>
    ["All", ...Array.from(new Set(sessions.map(s => s.class))).sort()],
    [sessions]
  );

  const filtered = useMemo(() =>
    sessions.filter(oc =>
      (statusFilter === "All" || oc.status === statusFilter) &&
      (classFilter === "All" || oc.class === classFilter) &&
      (
        oc.title.toLowerCase().includes(search.toLowerCase()) ||
        oc.subject.toLowerCase().includes(search.toLowerCase()) ||
        (oc.teacherName ?? "").toLowerCase().includes(search.toLowerCase())
      )
    ),
    [sessions, statusFilter, classFilter, search]
  );

  const liveCount      = sessions.filter(c => c.status === "Live").length;
  const scheduledCount = sessions.filter(c => c.status === "Scheduled").length;
  const endedCount     = sessions.filter(c => c.status === "Ended").length;

  const handleGenerate = async (oc: OnlineClassDoc) => {
    const link = generateMeetLink();
    try {
      await updateDocument("onlineClasses", oc.id, { meetLink: link });
      toast({ title: "Link Generated", description: link });
    } catch {
      toast({ title: "Error", description: "Could not save link.", variant: "destructive" });
    }
  };

  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: "Copied", description: "Meet link copied to clipboard." });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Live Classes" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/online-classes" className="hover:text-[#0D7C8F]">Online Classes</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Live Classes</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">G Meet — Live Classes</h2>
          <Link href="/admin/online-classes/meeting-link">
            <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
              <Plus className="h-4 w-4" /> New Meeting Link
            </Button>
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Live Now</p>
                <p className="text-2xl font-bold text-red-600">{liveCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Video className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-[#1E2A4A]">{scheduledCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ended</p>
                <p className="text-2xl font-bold text-[#1E2A4A]">{endedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#0D7C8F]/10 flex items-center justify-center flex-shrink-0">
                <Video className="h-4 w-4 text-[#0D7C8F]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold text-[#1E2A4A]">{sessions.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Title, subject, teacher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Live">Live Now</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Ended">Ended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map(c => (
                    <SelectItem key={c} value={c}>
                      {c === "All" ? "All Classes" : c}
                    </SelectItem>
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
              {filtered.length} Session{filtered.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Title / Teacher</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Meet Link</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? filtered.map(oc => {
                  const link = oc.meetLink;
                  return (
                    <TableRow key={oc.id} className="hover:bg-slate-50/50 align-middle">
                      <TableCell>
                        <Badge variant="outline" className="font-bold text-[#1E2A4A]">
                          {oc.class}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{oc.subject}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold text-[#1E2A4A]">{oc.date}</p>
                        <p className="text-xs text-muted-foreground">{oc.time}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{oc.duration ?? "—"} mins</span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold text-[#1E2A4A] max-w-[160px] truncate">
                          {oc.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{oc.teacherName || "—"}</p>
                      </TableCell>
                      <TableCell>
                        {oc.status === "Live" ? (
                          <Badge className="bg-red-600 animate-pulse gap-1.5 flex w-fit items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE
                          </Badge>
                        ) : oc.status === "Scheduled" ? (
                          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                            Scheduled
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                            Ended
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {link ? (
                          <div className="flex items-center gap-1.5 max-w-[200px]">
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#0D7C8F] hover:underline font-mono truncate block max-w-[140px]"
                            >
                              {link.replace("https://", "")}
                            </a>
                            <Button
                              variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              onClick={() => handleCopy(link)}
                              title="Copy link"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 text-[#0D7C8F] border-[#0D7C8F]"
                            onClick={() => handleGenerate(oc)}
                          >
                            <RefreshCw className="h-3 w-3" /> Generate
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {oc.status !== "Ended" && link && (
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-[#0D7C8F] hover:bg-teal-50 hover:text-[#0D7C8F]"
                              title="Join Meeting"
                              onClick={() => window.open(link, "_blank")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Link href="/admin/online-classes/attendance">
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                              title="Take Attendance"
                            >
                              <ClipboardCheck className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Video className="h-8 w-8 opacity-20" />
                        <p>No classes found matching your filters.</p>
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
