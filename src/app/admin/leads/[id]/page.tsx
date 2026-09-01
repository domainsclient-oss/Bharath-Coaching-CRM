"use client";

import { useState, useEffect } from "react";
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
  User,
  Mail,
  Calendar,
  Plus,
  Send,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getDocument, updateDocument } from "@/services/firestoreService";
import { Skeleton } from "@/components/ui/skeleton";
import { SOURCE_COLORS } from "@/data/leadsData";

interface Lead {
  id: string;
  enquiryNo?: string;
  name: string;
  age?: number;
  classInterested?: string;
  board?: string;
  phone?: string;
  whatsapp?: string;
  parentName?: string;
  email?: string;
  source?: string;
  mode?: string;
  assignedTo?: string;
  subjects?: string[];
  notes?: string;
  status?: string;
  followUpDate?: string;
  branchId: string;
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDocument<Lead>("enquiries", id)
      .then((doc) => setLead(doc))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;
    setSavingNote(true);
    try {
      // Append note to the existing notes field (simple approach)
      const timestamp = new Date().toLocaleString("en-IN");
      const noteEntry = `[${timestamp}] ${newNote.trim()}`;
      const updatedNotes = lead?.notes
        ? `${lead.notes}\n${noteEntry}`
        : noteEntry;
      await updateDocument("enquiries", id, { notes: updatedNotes });
      setLead((prev) => prev ? { ...prev, notes: updatedNotes } : prev);
      toast({ title: "Note Added", description: "Internal note has been saved." });
      setNewNote("");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not save note." });
    } finally {
      setSavingNote(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
        <SharedHeader title="Enquiry Detail" />
        <main className="p-4 md:p-6 lg:p-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
        <SharedHeader title="Enquiry Detail" />
        <main className="p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-red-600">Enquiry not found</h2>
          <Button onClick={() => router.push("/admin/leads")}>Back to Pipeline</Button>
        </main>
      </div>
    );
  }

  const sourceColor =
    SOURCE_COLORS[lead.source as keyof typeof SOURCE_COLORS] ??
    "bg-slate-100 text-slate-700";

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
            <span className="font-medium text-foreground">{lead.enquiryNo ?? lead.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/leads/add?edit=${lead.id}`}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Link>
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 gap-2" asChild>
              <Link href={`/admin/students/add?fromEnquiry=${lead.id}&name=${encodeURIComponent(lead.name)}&phone=${lead.phone ?? ""}&parent=${encodeURIComponent(lead.parentName ?? "")}&class=${lead.classInterested ?? ""}`}>
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
                  {lead.enquiryNo && (
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-3 font-bold">
                      {lead.enquiryNo}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-white/70">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> Class {lead.classInterested} · {lead.board}
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4" /> {lead.phone}
                    </div>
                  )}
                  {lead.parentName && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4" /> {lead.parentName} (Parent)
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {lead.source && (
                  <Badge className={cn("px-4 py-1 font-bold", sourceColor)}>
                    {lead.source}
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-white/10 text-white border-none uppercase tracking-widest text-[10px]">
                  Status: {lead.status ?? "New"}
                </Badge>
              </div>
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <div className="bg-white border-b px-6">
              <TabsList className="h-14 bg-transparent p-0 gap-8">
                {["details", "notes"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0D7C8F] data-[state=active]:text-[#0D7C8F] font-bold px-0 capitalize"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="p-6 bg-slate-50/50">
              {/* DETAILS TAB */}
              <TabsContent value="details" className="mt-0 space-y-6 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <User className="h-4 w-4 text-[#0D7C8F]" /> Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 grid grid-cols-2 gap-y-4 gap-x-8">
                      {[
                        { label: "Full Name",    value: lead.name },
                        { label: "Age",          value: lead.age ? `${lead.age} Years` : "—" },
                        { label: "Parent Name",  value: lead.parentName ?? "—" },
                        { label: "Email",        value: lead.email ?? "—" },
                        { label: "Phone",        value: lead.phone ?? "—" },
                        { label: "WhatsApp",     value: lead.whatsapp ?? "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
                          <p className="text-sm font-medium">{value}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#0D7C8F]" /> Academic & Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Class Interested</p>
                          <p className="text-sm font-medium">Class {lead.classInterested}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Board</p>
                          <p className="text-sm font-medium">{lead.board ?? "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Preferred Mode</p>
                          <Badge variant="secondary" className="text-[10px]">{lead.mode ?? "—"}</Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Assigned To</p>
                          <p className="text-sm font-medium text-[#0D7C8F]">{lead.assignedTo ?? "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Follow-up Date</p>
                          <p className="text-sm font-medium">{lead.followUpDate ?? "—"}</p>
                        </div>
                      </div>
                      {(lead.subjects ?? []).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Subjects</p>
                          <div className="flex flex-wrap gap-2">
                            {(lead.subjects ?? []).map((s) => (
                              <Badge key={s} className="bg-[#1E2A4A]">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {lead.notes && (
                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-[#0D7C8F]" /> Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                        {lead.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* NOTES TAB */}
              <TabsContent value="notes" className="mt-0 space-y-6 outline-none">
                <Card className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <form onSubmit={handleAddNote} className="space-y-4">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Add Internal Note
                      </Label>
                      <Textarea
                        placeholder="Type your observations here..."
                        className="h-24 resize-none"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          className="bg-[#0D7C8F] gap-2"
                          disabled={savingNote || !newNote.trim()}
                        >
                          <Send className="h-4 w-4" />
                          {savingNote ? "Saving..." : "Save Note"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {lead.notes ? (
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Note History</p>
                      <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                        {lead.notes}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12 bg-white/50 rounded-xl border-2 border-dashed border-slate-200">
                    <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">No internal notes yet.</p>
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
