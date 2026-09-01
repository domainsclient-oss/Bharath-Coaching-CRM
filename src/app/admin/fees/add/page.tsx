"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, Save, ArrowLeft, User, IndianRupee,
  Plus, Trash2, BookOpen,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface StudentDoc {
  id: string;
  name: string;
  class?: string;
  board?: string;
  subjects?: string[];
  branchId: string;
}

interface InstForm {
  amount: string;
  date: string;
}

const EMPTY_INST: InstForm = { amount: "", date: "" };

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AddFeeRecordPage() {
  const router = useRouter();
  const { currentBranch } = useBranch();
  const { data: students } = useFirestoreCollection<StudentDoc>("students", currentBranch);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentBoard, setStudentBoard] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [feeType, setFeeType] = useState("Standard");
  const [totalFee, setTotalFee] = useState("");
  const [instalments, setInstalments] = useState<InstForm[]>([{ ...EMPTY_INST }]);
  const [saving, setSaving] = useState(false);

  const sortedStudents = useMemo(() =>
    [...students].sort((a, b) => a.name.localeCompare(b.name)),
    [students]
  );

  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    if (id === "_manual") {
      setStudentName(""); setStudentClass(""); setStudentBoard(""); setSubjects([]);
      return;
    }
    const s = students.find(s => s.id === id);
    if (s) {
      setStudentName(s.name);
      setStudentClass(s.class ?? "");
      setStudentBoard(s.board ?? "");
      setSubjects(s.subjects ?? []);
    }
  };

  const addSubject = () => {
    const s = subjectInput.trim();
    if (s && !subjects.includes(s)) setSubjects(prev => [...prev, s]);
    setSubjectInput("");
  };

  const addInstalment = () => {
    if (instalments.length < 4) setInstalments(prev => [...prev, { ...EMPTY_INST }]);
  };

  const removeInstalment = (i: number) =>
    setInstalments(prev => prev.filter((_, idx) => idx !== i));

  const updateInstalment = (i: number, field: keyof InstForm, value: string) =>
    setInstalments(prev => prev.map((inst, idx) => idx === i ? { ...inst, [field]: value } : inst));

  const instTotal = instalments.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  const total = parseFloat(totalFee) || 0;
  const balance = total - instTotal;

  const handleSave = async () => {
    if (!studentName.trim()) {
      toast({ title: "Missing Student", description: "Please select or enter a student name.", variant: "destructive" });
      return;
    }
    if (!totalFee || total <= 0) {
      toast({ title: "Missing Total Fee", description: "Enter a valid total fee amount.", variant: "destructive" });
      return;
    }
    if (instalments.some(i => !i.amount || !i.date)) {
      toast({ title: "Incomplete Instalments", description: "Each instalment needs an amount and due date.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const year = new Date().getFullYear();
      const billNo = `BA-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

      const firstInstDate = instalments[0]?.date ?? "";

      await addDocument("fees", {
        billNo,
        studentId: selectedStudentId && selectedStudentId !== "_manual" ? selectedStudentId : "",
        studentName: studentName.trim(),
        class: studentClass,
        board: studentBoard,
        subjects,
        feeType,
        totalFee: total,
        amountPaid: 0,
        balance: total,
        status: "Unpaid",
        dueDate: firstInstDate,
        paymentDate: null,
        mode: null,
        branchId: currentBranch,
      });

      toast({ title: "Fee Record Added", description: `${studentName} — Bill: ${billNo}` });
      router.push("/admin/fees/collect");
    } catch {
      toast({ title: "Error", description: "Could not save fee record.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Add Fee Record" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        <div className="flex flex-col gap-1">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/fees/collect" className="hover:text-[#0D7C8F]">Collect Fees</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Add Fee Record</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Add Fee Record</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/fees/collect"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Student Details */}
          <Card className="border-none shadow-sm h-fit">
            <CardContent className="p-6 space-y-5">
              <div className="border-b pb-2">
                <h3 className="font-bold text-[#1E2A4A] flex items-center gap-2">
                  <User className="h-4 w-4 text-[#0D7C8F]" /> Student Details
                </h3>
              </div>

              <div className="space-y-2">
                <Label>Select Student</Label>
                <Select value={selectedStudentId} onValueChange={handleStudentSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose from existing students..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_manual">— Enter manually —</SelectItem>
                    {sortedStudents.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}{s.class ? ` · Class ${s.class}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Student Name *</Label>
                <Input
                  placeholder="Full name"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Input placeholder="e.g. 10" value={studentClass} onChange={e => setStudentClass(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Board</Label>
                  <Select value={studentBoard} onValueChange={setStudentBoard}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["CBSE", "ICSE", "State", "Samacheer", "IB"].map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subjects</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add subject..."
                    value={subjectInput}
                    onChange={e => setSubjectInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSubject())}
                  />
                  <Button type="button" variant="secondary" size="icon" onClick={addSubject}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {subjects.map(s => (
                    <Badge
                      key={s} className="bg-[#1E2A4A] gap-1 px-2 py-1 cursor-pointer"
                      onClick={() => setSubjects(prev => prev.filter(x => x !== s))}
                    >
                      {s} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fee Type</Label>
                <Select value={feeType} onValueChange={setFeeType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Standard", "One-to-One", "Group", "Online", "Special"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fee & Instalments */}
          <Card className="border-none shadow-sm h-fit">
            <CardContent className="p-6 space-y-5">
              <div className="border-b pb-2">
                <h3 className="font-bold text-[#1E2A4A] flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-[#0D7C8F]" /> Fee Structure
                </h3>
              </div>

              <div className="space-y-2">
                <Label>Total Fee Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₹</span>
                  <Input
                    className="pl-7"
                    type="number"
                    placeholder="0"
                    value={totalFee}
                    onChange={e => setTotalFee(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Instalments *</Label>
                  {instalments.length < 4 && (
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addInstalment}>
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  )}
                </div>

                {instalments.map((inst, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Instalment {i + 1} Amount</p>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">₹</span>
                        <Input
                          className="pl-6 h-9 text-sm"
                          type="number"
                          placeholder="0"
                          value={inst.amount}
                          onChange={e => updateInstalment(i, "amount", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <Input
                        className="h-9 text-sm"
                        type="date"
                        value={inst.date}
                        onChange={e => updateInstalment(i, "date", e.target.value)}
                      />
                    </div>
                    {instalments.length > 1 && (
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeInstalment(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Fee</span>
                  <span className="font-semibold">₹{total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Instalment Total</span>
                  <span className={instTotal > total ? "text-red-600 font-semibold" : "font-semibold"}>
                    ₹{instTotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Balance</span>
                  <span className={`font-bold ${balance < 0 ? "text-red-600" : balance === 0 ? "text-green-600" : "text-amber-600"}`}>
                    ₹{balance.toLocaleString("en-IN")}
                  </span>
                </div>
                {instTotal > total && (
                  <p className="text-xs text-red-600">⚠ Instalment total exceeds the total fee.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 border-t pt-6">
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button className="bg-[#0D7C8F] hover:bg-[#0a6275] px-8 gap-2" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : <><Save className="h-4 w-4" /> Save Fee Record</>}
          </Button>
        </div>
      </main>
    </div>
  );
}
