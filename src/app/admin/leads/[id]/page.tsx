
"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronRight, 
  ArrowLeft, 
  Pencil, 
  UserCheck, 
  History, 
  MessageSquare, 
  Phone, 
  Clock, 
  User, 
  Mail, 
  MapPin, 
  Calendar,
  Plus,
  Send,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockLeads, SOURCE_COLORS } from "@/data/leadsData";
import { mockLeadTimeline, mockLeadNotes, mockLeadCalls } from "@/data/leadDetailsData";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentBranch } = useAuth();
  const [newNote, setNewNote] = useState("");

  const lead = useMemo(() => {
    return mockLeads.find(l => l.id === id);
  }, [id]);

  if (!lead) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">Lead not found</h2>
        <Button onClick={() => router.push('/admin/leads')} className="mt-4">Back to Pipeline</Button>
      </div>
    );
  }

  const timeline = mockLeadTimeline[lead.id] || [];
  const notes = mockLeadNotes[lead.id] || [];
  const calls = mockLeadCalls[lead.id] || [];

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    toast({
      title: "Note Added",
      description: "Internal note has been saved to the enquiry record.",
    });
    setNewNote("");
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Enquiry Detail" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/leads" className="hover:text-[#0D7C8F]">Pipeline</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">{lead.enquiryNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/leads/add?edit=${lead.id}`}><Pencil className="h-4 w-4 mr-2" /> Edit</Link>
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 size-sm gap-2" asChild>
              <Link href={`/admin/students/add?fromEnquiry=${lead.id}&name=${encodeURIComponent(lead.name)}&phone=${lead.phone}&parent=${encodeURIComponent(lead.parentName)}&class=${lead.classInterested}`}>
                <UserCheck className="h-4 w-4" /> Convert to Student
              </Link>
            </Button>
          </div>
        </div>

        {/* Lead Header Card */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="bg-[#1E2A4A] p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <Avatar className="h-20 w-24 border-4 border-white/10 text-[#1E2A4A] bg-white rounded-xl">
                <AvatarFallback className="text-2xl font-bold">{getInitials(lead.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold">{lead.name}</h1>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-3 font-bold">
                    {lead.enquiryNo}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-white/70">
                  <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Class {lead.classInterested} • {lead.board}</div>
                  <div className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {lead.phone}</div>
                  <div className="flex items-center gap-1.5"><User className="h-4 w-4" /> {lead.parentName} (Parent)</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={cn("px-4 py-1 font-bold", SOURCE_COLORS[lead.source])}>
                  {lead.source}
                </Badge>
                <Badge variant="secondary" className="bg-white/10 text-white border-none uppercase tracking-widest text-[10px]">
                  Status: {lead.status}
                </Badge>
              </div>
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <div className="bg-white border-b px-6">
              <TabsList className="h-14 bg-transparent p-0 gap-8">
                <TabsTrigger value="details" className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0D7C8F] data-[state=active]:text-[#0D7C8F] font-bold px-0">Details</TabsTrigger>
                <TabsTrigger value="timeline" className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0D7C8F] data-[state=active]:text-[#0D7C8F] font-bold px-0">Timeline</TabsTrigger>
                <TabsTrigger value="notes" className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0D7C8F] data-[state=active]:text-[#0D7C8F] font-bold px-0">Notes</TabsTrigger>
                <TabsTrigger value="calls" className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0D7C8F] data-[state=active]:text-[#0D7C8F] font-bold px-0">Phone Log</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 bg-slate-50/50">
              {/* DETAILS TAB */}
              <TabsContent value="details" className="mt-0 space-y-6 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2"><User className="h-4 w-4 text-[#0D7C8F]" /> Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 grid grid-cols-2 gap-y-4 gap-x-8">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Full Name</p>
                        <p className="text-sm font-medium">{lead.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Age</p>
                        <p className="text-sm font-medium">{lead.age} Years</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Parent Name</p>
                        <p className="text-sm font-medium">{lead.parentName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{lead.email || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">{lead.phone}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">WhatsApp</p>
                        <p className="text-sm font-medium">{lead.whatsapp}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2"><Calendar className="h-4 w-4 text-[#0D7C8F]" /> Academic & Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Class Interested</p>
                          <p className="text-sm font-medium">Class {lead.classInterested}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Board</p>
                          <p className="text-sm font-medium">{lead.board}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Preferred Mode</p>
                          <Badge variant="secondary" className="text-[10px]">{lead.mode}</Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Assigned To</p>
                          <p className="text-sm font-medium text-[#0D7C8F]">{lead.assignedTo}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Subjects</p>
                        <div className="flex flex-wrap gap-2">
                          {lead.subjects.map(s => <Badge key={s} className="bg-[#1E2A4A]">{s}</Badge>)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[#0D7C8F]" /> Initial Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-slate-600 leading-relaxed italic">"{lead.notes}"</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TIMELINE TAB */}
              <TabsContent value="timeline" className="mt-0 outline-none">
                <div className="max-w-2xl mx-auto space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
                  {timeline.map((event) => (
                    <div key={event.id} className="relative flex items-center justify-between group">
                      <div className="flex items-center w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#0D7C8F] text-white shadow shrink-0 z-10">
                          <History className="h-4 w-4" />
                        </div>
                        <div className="w-full ml-6 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 text-sm">{event.action}</span>
                            <time className="text-[10px] text-muted-foreground font-medium">{event.date}</time>
                          </div>
                          <div className="text-xs text-muted-foreground">by {event.by}</div>
                          {event.details && <div className="mt-2 text-xs bg-slate-50 p-2 rounded border-l-2 border-[#0D7C8F] text-slate-600">{event.details}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* NOTES TAB */}
              <TabsContent value="notes" className="mt-0 space-y-6 outline-none">
                <Card className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <form onSubmit={handleAddNote} className="space-y-4">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Add Internal Note</Label>
                      <Textarea 
                        placeholder="Type your observations here..." 
                        className="h-24 resize-none"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button type="submit" className="bg-[#0D7C8F] gap-2">
                          <Send className="h-4 w-4" /> Save Note
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#1E2A4A] uppercase tracking-wider">Note History</h3>
                  {notes.length > 0 ? (
                    notes.map(note => (
                      <Card key={note.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-[#0D7C8F]/10 flex items-center justify-center text-[#0D7C8F] text-[10px] font-bold">
                                {note.by.charAt(0)}
                              </div>
                              <span className="text-xs font-bold text-[#1E2A4A]">{note.by}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium">{note.date}</span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{note.content}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-white/50 rounded-xl border-2 border-dashed border-slate-200">
                      <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-400">No internal notes yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* PHONE LOG TAB */}
              <TabsContent value="calls" className="mt-0 space-y-6 outline-none">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[#1E2A4A] uppercase tracking-wider">Call History</h3>
                  <Button size="sm" variant="outline" className="gap-2 border-[#0D7C8F] text-[#0D7C8F] hover:bg-[#0D7C8F] hover:text-white">
                    <Phone className="h-3.5 w-3.5" /> Log New Call
                  </Button>
                </div>

                {calls.length > 0 ? (
                  <div className="grid gap-4">
                    {calls.map(call => (
                      <Card key={call.id} className="border-none shadow-sm overflow-hidden border-l-4 border-[#0D7C8F]">
                        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center",
                              call.type === "Outgoing" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                            )}>
                              <Phone className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[#1E2A4A]">{call.type} Call</span>
                                <Badge variant="secondary" className="text-[9px] h-4">{call.duration}</Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-medium">{call.date} • by {call.by}</p>
                            </div>
                          </div>
                          <div className="flex-1 md:px-8">
                            <p className="text-xs text-slate-600 font-medium italic">"{call.outcome}"</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white/50 rounded-xl border-2 border-dashed border-slate-200">
                    <Phone className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">No calls have been logged for this enquiry.</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}
