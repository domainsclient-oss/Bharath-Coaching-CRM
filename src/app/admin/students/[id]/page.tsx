"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  Printer,
  ChevronRight,
  User,
  CreditCard,
  ClipboardCheck,
  FileText,
  History,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  IndianRupee,
  MessageSquare,
  GraduationCap,
  Ban,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDocument, updateDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Student {
  id: string;
  appNo?: string;
  rollNo?: string;
  name: string;
  class: string;
  board: string;
  mode: string;
  status: string;
  parentName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
  dob?: string;
  gender?: string;
  school?: string;
  previousSchool?: string;
  admissionDate?: string;
  subjects?: string[];
  photo?: string;
  branchId: string;
  // Discontinued fields
  billNo?: string;
  totalFees?: number;
  collectedFees?: number;
  balance?: number;
  discontinuedReason?: string;
  discontinuedDate?: string;
}

interface DiscontinueForm {
  reason: string;
  date: string;
  totalFees: string;
  collectedFees: string;
  billNo: string;
}

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDiscontinueDialog, setShowDiscontinueDialog] = useState(false);
  const [discontinueForm, setDiscontinueForm] = useState<DiscontinueForm>({
    reason: "",
    date: new Date().toISOString().split("T")[0],
    totalFees: "",
    collectedFees: "",
    billNo: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDocument<Student>("students", id)
      .then((doc) => {
        if (doc) {
          setStudent(doc);
          // Pre-fill fee fields if already recorded
          setDiscontinueForm((f) => ({
            ...f,
            totalFees: doc.totalFees != null ? String(doc.totalFees) : "",
            collectedFees: doc.collectedFees != null ? String(doc.collectedFees) : "",
            billNo: doc.billNo ?? "",
            reason: doc.discontinuedReason ?? "",
            date: doc.discontinuedDate ?? new Date().toISOString().split("T")[0],
          }));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const balance =
    discontinueForm.totalFees && discontinueForm.collectedFees
      ? Math.max(0, Number(discontinueForm.totalFees) - Number(discontinueForm.collectedFees))
      : null;

  const handleDiscontinue = async () => {
    if (!discontinueForm.reason.trim()) {
      toast({ variant: "destructive", title: "Reason required", description: "Please enter a reason for discontinuation." });
      return;
    }
    setSaving(true);
    try {
      // Build payload — omit keys that have no value (Firestore rejects undefined)
      const payload: Record<string, any> = {
        status: "Discontinued",
        discontinuedReason: discontinueForm.reason,
        discontinuedDate: discontinueForm.date,
      };
      if (discontinueForm.billNo)      payload.billNo       = discontinueForm.billNo;
      if (discontinueForm.totalFees)   payload.totalFees    = Number(discontinueForm.totalFees);
      if (discontinueForm.collectedFees) payload.collectedFees = Number(discontinueForm.collectedFees);
      if (balance !== null)            payload.balance      = balance;
      await updateDocument("students", id, payload);
      setStudent((prev) => prev ? { ...prev, ...payload } : prev);
      toast({ title: "Student Discontinued", description: `${student?.name} has been marked as Discontinued.` });
      setShowDiscontinueDialog(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not update student status." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
        <SharedHeader title="Student Profile" />
        <main className="p-4 md:p-6 lg:p-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
        <SharedHeader title="Student Profile" />
        <main className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-600">Student not found</h2>
          <Button onClick={() => router.push("/admin/students")} className="mt-4">Back to Students</Button>
        </main>
      </div>
    );
  }

  const statusColor =
    student.status === "Active" ? "bg-green-500/20 text-green-100 border-green-500/30" :
    student.status === "Discontinued" ? "bg-red-500/20 text-red-200 border-red-500/30" :
    "bg-slate-500/20 text-slate-200 border-slate-500/30";

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Student Profile" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/students" className="hover:text-[#0D7C8F]">Students</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">{student.name}</span>
        </div>

        {/* Profile Header */}
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#1E2A4A] to-[#0D7C8F] p-6 md:p-8 text-white relative">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-white/20 shadow-xl">
                <AvatarImage src={student.photo} />
                <AvatarFallback className="bg-white/10 text-white text-2xl font-bold">
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h1 className="text-2xl md:text-3xl font-bold">{student.name}</h1>
                  <div className="flex gap-2 justify-center">
                    <Badge className={statusColor}>{student.status}</Badge>
                    <Badge className="bg-white/20 text-white border-white/30">{student.mode}</Badge>
                  </div>
                </div>
                <p className="text-white/70 font-medium">Application No: {student.appNo ?? "—"}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-white/80">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" /> Class {student.class} · {student.board}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {student.branchId} Branch
                  </div>
                  {student.school && (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" /> {student.school}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  asChild
                >
                  <Link href={`/admin/students/${student.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Link>
                </Button>
                {student.status !== "Discontinued" && (
                  <Button
                    variant="outline"
                    className="bg-red-500/20 border-red-400/30 text-red-100 hover:bg-red-500/30"
                    onClick={() => setShowDiscontinueDialog(true)}
                  >
                    <Ban className="mr-2 h-4 w-4" /> Mark Discontinued
                  </Button>
                )}
              </div>
            </div>

            {/* Discontinued banner */}
            {student.status === "Discontinued" && (
              <div className="mt-4 bg-red-500/20 border border-red-400/30 rounded-lg p-3 flex flex-wrap gap-4 text-sm text-red-100">
                <span><span className="font-bold">Reason:</span> {student.discontinuedReason ?? "—"}</span>
                <span><span className="font-bold">Date:</span> {student.discontinuedDate ?? "—"}</span>
                {student.balance != null && (
                  <span><span className="font-bold">Balance Due:</span> ₹{student.balance.toLocaleString("en-IN")}</span>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <div className="bg-white border-b px-6">
              <TabsList className="h-14 bg-transparent p-0 gap-8">
                {[
                  { value: "profile", label: "Profile" },
                  { value: "fees", label: "Fees" },
                  { value: "attendance", label: "Attendance" },
                  { value: "marks", label: "Marks" },
                  { value: "activity", label: "Activity Log" },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0D7C8F] data-[state=active]:bg-transparent data-[state=active]:text-[#0D7C8F] px-0 font-bold"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <CardContent className="p-6 bg-slate-50/50">
              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <User className="h-4 w-4 text-[#0D7C8F]" /> Personal & Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Full Name</p>
                          <p className="text-sm font-medium">{student.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Date of Birth</p>
                          <p className="text-sm font-medium">{student.dob ?? "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Parent Name</p>
                          <p className="text-sm font-medium">{student.parentName ?? "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Gender</p>
                          <p className="text-sm font-medium">{student.gender ?? "—"}</p>
                        </div>
                      </div>
                      <div className="pt-2 space-y-3">
                        {student.phone && (
                          <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{student.phone}</span>
                          </div>
                        )}
                        {student.whatsapp && (
                          <div className="flex items-center gap-3 text-sm">
                            <MessageSquare className="h-4 w-4 text-green-600" />
                            <span>{student.whatsapp}</span>
                          </div>
                        )}
                        {student.email && (
                          <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{student.email}</span>
                          </div>
                        )}
                        {(student.address || student.city) && (
                          <div className="flex items-start gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>
                              {[student.address, student.city, student.pincode].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-[#0D7C8F]" /> Academic Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">School</p>
                          <p className="text-sm font-medium">{student.school ?? "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Class & Board</p>
                          <p className="text-sm font-medium">{student.class} ({student.board})</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Mode</p>
                          <Badge variant="secondary" className="text-[10px]">{student.mode}</Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Admission Date</p>
                          <p className="text-sm font-medium">{student.admissionDate ?? "—"}</p>
                        </div>
                      </div>
                      {(student.subjects ?? []).length > 0 && (
                        <div className="pt-2">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Subjects</p>
                          <div className="flex flex-wrap gap-2">
                            {(student.subjects ?? []).map((sub, i) => (
                              <Badge key={i} className="bg-[#1E2A4A]">{sub}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Fees Tab */}
              <TabsContent value="fees" className="mt-0 space-y-6">
                {student.status === "Discontinued" && student.totalFees != null ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-none shadow-sm border-l-4 border-[#1E2A4A]">
                      <CardContent className="pt-6">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Total Fees</p>
                        <h3 className="text-2xl font-bold text-[#1E2A4A] mt-1">₹{(student.totalFees ?? 0).toLocaleString("en-IN")}</h3>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm border-l-4 border-green-600">
                      <CardContent className="pt-6">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Collected</p>
                        <h3 className="text-2xl font-bold text-green-600 mt-1">₹{(student.collectedFees ?? 0).toLocaleString("en-IN")}</h3>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm border-l-4 border-red-500">
                      <CardContent className="pt-6">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Balance Due</p>
                        <h3 className="text-2xl font-bold text-red-500 mt-1">₹{(student.balance ?? 0).toLocaleString("en-IN")}</h3>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-8 text-center text-muted-foreground text-sm">
                      <IndianRupee className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>Fee records will appear here once available.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="mt-0">
                <Card className="border-none shadow-sm">
                  <CardContent className="p-8 text-center text-muted-foreground text-sm">
                    <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>Attendance records will appear here.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Marks Tab */}
              <TabsContent value="marks" className="mt-0">
                <Card className="border-none shadow-sm">
                  <CardContent className="p-8 text-center text-muted-foreground text-sm">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>Assessment records will appear here.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Log Tab */}
              <TabsContent value="activity" className="mt-0">
                <Card className="border-none shadow-sm">
                  <CardContent className="p-8 text-center text-muted-foreground text-sm">
                    <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>Activity log will appear here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </main>

      {/* Mark as Discontinued Dialog */}
      <Dialog open={showDiscontinueDialog} onOpenChange={setShowDiscontinueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Mark as Discontinued</DialogTitle>
            <DialogDescription>
              This will change <span className="font-semibold">{student.name}</span>'s status to <span className="font-semibold text-red-600">Discontinued</span>. Fill in the fee settlement details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="disc-reason" className="text-xs font-bold uppercase text-muted-foreground">
                Reason for Discontinuation <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="disc-reason"
                placeholder="e.g. Shifted to another city, personal reasons..."
                rows={3}
                value={discontinueForm.reason}
                onChange={(e) => setDiscontinueForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="disc-date" className="text-xs font-bold uppercase text-muted-foreground">
                Date of Discontinuation
              </Label>
              <Input
                id="disc-date"
                type="date"
                value={discontinueForm.date}
                onChange={(e) => setDiscontinueForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="disc-total" className="text-xs font-bold uppercase text-muted-foreground">
                  Total Fees (₹)
                </Label>
                <Input
                  id="disc-total"
                  type="number"
                  placeholder="0"
                  value={discontinueForm.totalFees}
                  onChange={(e) => setDiscontinueForm((f) => ({ ...f, totalFees: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="disc-collected" className="text-xs font-bold uppercase text-muted-foreground">
                  Collected (₹)
                </Label>
                <Input
                  id="disc-collected"
                  type="number"
                  placeholder="0"
                  value={discontinueForm.collectedFees}
                  onChange={(e) => setDiscontinueForm((f) => ({ ...f, collectedFees: e.target.value }))}
                />
              </div>
            </div>

            {balance !== null && (
              <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <span className="text-sm font-bold text-red-700">Balance Due</span>
                <span className="text-lg font-bold text-red-700">₹{balance.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="disc-bill" className="text-xs font-bold uppercase text-muted-foreground">
                Bill No (optional)
              </Label>
              <Input
                id="disc-bill"
                placeholder="e.g. BILL-2026-001"
                value={discontinueForm.billNo}
                onChange={(e) => setDiscontinueForm((f) => ({ ...f, billNo: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscontinueDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDiscontinue}
              disabled={saving}
            >
              {saving ? "Saving..." : "Confirm Discontinue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
