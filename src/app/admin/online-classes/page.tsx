
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Video, 
  ExternalLink, 
  Trash2, 
  Edit,
  ClipboardCheck,
  Calendar,
  Clock,
  Filter,
  Link as LinkIcon
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mockOnlineClasses, OnlineClass } from "@/data/onlineClassesData";
import { mockClasses, mockSubjects } from "@/data/academicsData";
import { mockStaff } from "@/data/hrData";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function OnlineClassesPage() {
  useAuth();
  const { currentBranch } = useBranch();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [meetLink, setMeetLink] = useState("");

  const branchClasses = useMemo(() => {
    return mockOnlineClasses.filter(oc => oc.branchId === currentBranch);
  }, [currentBranch]);

  const liveCount = branchClasses.filter(c => c.status === "Live").length;
  const scheduledCount = branchClasses.filter(c => c.status === "Scheduled").length;
  const endedCount = branchClasses.filter(c => c.status === "Ended").length;

  const filteredByStatus = (status: string) => {
    return branchClasses.filter(oc => {
      const matchesStatus = status === "All" || oc.status === status;
      const matchesSearch = oc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           oc.subject.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  };

  const handleGenerateLink = () => {
    const random = Math.random().toString(36).substring(2, 5) + "-" + 
                   Math.random().toString(36).substring(2, 6) + "-" + 
                   Math.random().toString(36).substring(2, 5);
    setMeetLink(`https://meet.google.com/${random}`);
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Class Scheduled",
      description: "New online session has been created and links shared.",
    });
    setIsCreateModalOpen(false);
    setMeetLink("");
  };

  const StatusTable = ({ classes }: { classes: OnlineClass[] }) => (
    <Table>
      <TableHeader className="bg-slate-50">
        <TableRow>
          <TableHead>Session Title</TableHead>
          <TableHead>Class & Subject</TableHead>
          <TableHead>Faculty</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {classes.length > 0 ? (
          classes.map((oc) => (
            <TableRow key={oc.id} className="hover:bg-slate-50/50 group">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-[#1E2A4A]">{oc.title}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{oc.meetLink}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Class {oc.class}</span>
                  <Badge variant="secondary" className="w-fit text-[10px] py-0 h-4">{oc.subject}</Badge>
                </div>
              </TableCell>
              <TableCell className="text-sm font-medium">{oc.teacherName}</TableCell>
              <TableCell>
                <div className="flex flex-col text-xs">
                  <span className="font-bold">{oc.date}</span>
                  <span className="text-muted-foreground">{oc.time}</span>
                </div>
              </TableCell>
              <TableCell className="text-xs font-medium">{oc.duration} mins</TableCell>
              <TableCell>
                {oc.status === "Live" ? (
                  <Badge className="bg-red-600 animate-pulse gap-1.5 flex w-fit items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE NOW
                  </Badge>
                ) : oc.status === "Scheduled" ? (
                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Scheduled</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none">Ended</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-[#0D7C8F]" 
                    disabled={oc.status === "Ended"}
                    onClick={() => window.open(oc.meetLink, '_blank')}
                    title="Join Session"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" title="Attendance">
                    <ClipboardCheck className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-[#1E2A4A]">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
              No sessions found matching your filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Online Classes" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Header & Breadcrumbs */}
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Online Classes</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Virtual Classroom Hub</h2>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2 shadow-lg">
                  <Plus className="h-4 w-4" /> Schedule Class
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <form onSubmit={handleSaveSession}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-[#0D7C8F]" /> Schedule New Session
                    </DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new online class session.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Meeting Title *</Label>
                      <Input id="title" placeholder="e.g. Weekly Math Quiz Review" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Select Class *</Label>
                        <Select required>
                          <SelectTrigger>
                            <SelectValue placeholder="Class" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockClasses.filter(c => c.branchId === currentBranch).map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Select Subject *</Label>
                        <Select required>
                          <SelectTrigger>
                            <SelectValue placeholder="Subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockSubjects.filter(s => s.branchId === currentBranch).map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Date *</Label>
                        <Input type="date" required />
                      </div>
                      <div className="grid gap-2">
                        <Label>Time *</Label>
                        <Input type="time" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Duration (mins) *</Label>
                        <Select defaultValue="60">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 mins</SelectItem>
                            <SelectItem value="45">45 mins</SelectItem>
                            <SelectItem value="60">60 mins</SelectItem>
                            <SelectItem value="90">90 mins</SelectItem>
                            <SelectItem value="120">120 mins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Faculty *</Label>
                        <Select required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockStaff.filter(s => s.role === "Teacher" && s.branchId === currentBranch).map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Google Meet Link</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="https://meet.google.com/..." 
                          value={meetLink}
                          onChange={(e) => setMeetLink(e.target.value)}
                        />
                        <Button type="button" variant="outline" className="gap-2" onClick={handleGenerateLink}>
                          <LinkIcon className="h-3 w-3" /> Generate
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Brief Description</Label>
                      <Textarea placeholder="What will be covered in this session?" className="h-20" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-[#0D7C8F] w-full">Save Session</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters and Status Tabs */}
        <Card className="border-none shadow-sm overflow-hidden">
          <Tabs defaultValue="All" className="w-full">
            <div className="bg-white border-b px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <TabsList className="bg-slate-100/50 p-1">
                <TabsTrigger value="All" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">All</TabsTrigger>
                <TabsTrigger value="Live" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-600" /> Live Now ({liveCount})
                </TabsTrigger>
                <TabsTrigger value="Scheduled" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                  Scheduled ({scheduledCount})
                </TabsTrigger>
                <TabsTrigger value="Ended" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                  Ended ({endedCount})
                </TabsTrigger>
              </TabsList>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by topic..." 
                  className="pl-9 h-9" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <CardContent className="p-0">
              <TabsContent value="All" className="mt-0 outline-none">
                <StatusTable classes={filteredByStatus("All")} />
              </TabsContent>
              <TabsContent value="Live" className="mt-0 outline-none">
                <StatusTable classes={filteredByStatus("Live")} />
              </TabsContent>
              <TabsContent value="Scheduled" className="mt-0 outline-none">
                <StatusTable classes={filteredByStatus("Scheduled")} />
              </TabsContent>
              <TabsContent value="Ended" className="mt-0 outline-none">
                <StatusTable classes={filteredByStatus("Ended")} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Helper Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-[#1E2A4A] to-[#2a3a6a] text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-[#0D7C8F]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-white/60">Coming Up Next</p>
                <p className="text-sm font-bold mt-1">Physics Revision</p>
                <p className="text-[10px] text-white/40">Starts in 45 minutes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-[#0D7C8F] text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-white/60">Platform Status</p>
                <p className="text-sm font-bold mt-1">All Systems Operational</p>
                <p className="text-[10px] text-white/40">Integrations: Google Meet, Zoom</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Total Sessions This Week</p>
                <p className="text-sm font-bold text-[#1E2A4A] mt-1">24 Academic Hours</p>
                <p className="text-[10px] text-muted-foreground">+4 from last week</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
