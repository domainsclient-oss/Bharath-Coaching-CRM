"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, MessageSquare, Phone, Send, CheckCircle2,
  Bell, Filter, IndianRupee, Loader2,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { toast } from "@/hooks/use-toast";

interface FeeDoc {
  id: string;
  studentName?: string;
  name?: string;
  class?: string;
  billNo?: string;
  totalFee: number;
  amountPaid: number;
  balance: number;
  status: string;
  dueDate?: string;
  branchId: string;
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  default:  "Dear Parent, This is a reminder that your fee payment of ₹{balance} for {name} (Class {class}) is due on {dueDate}. Kindly pay at the earliest. — Bharath Academy",
  overdue:  "Dear Parent, The fee payment of ₹{balance} for {name} (Class {class}) is OVERDUE since {dueDate}. Please clear immediately to avoid penalty. — Bharath Academy",
  final:    "Dear Parent, FINAL NOTICE: ₹{balance} for {name} (Class {class}) is pending. Non-payment may result in suspension of classes. — Bharath Academy",
};

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const fmt = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

export default function FeesReminderPage() {
  const { currentBranch } = useBranch();
  const { data: allFees, loading } = useFirestoreCollection<FeeDoc>(
    "fees",
    currentBranch,
    { orderByField: "createdAt", orderByDir: "desc" }
  );

  const [channel,     setChannel]     = useState<"whatsapp" | "sms">("whatsapp");
  const [filterType,  setFilterType]  = useState("all");
  const [template,    setTemplate]    = useState("default");
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [message,     setMessage]     = useState(DEFAULT_TEMPLATES.default);
  const [sent,        setSent]        = useState<Set<string>>(new Set());

  const today = localToday();

  // Only students with a balance
  const pendingRecords = useMemo(() => {
    const withBalance = allFees
      .filter(r => (r.balance ?? 0) > 0)
      .map(r => ({
        ...r,
        isOverdue: !!(r.dueDate && r.dueDate < today),
        displayName: r.studentName ?? r.name ?? "—",
      }));

    if (filterType === "overdue")  return withBalance.filter(r => r.isOverdue);
    if (filterType === "upcoming") return withBalance.filter(r => !r.isOverdue);
    return withBalance;
  }, [allFees, filterType, today]);

  const handleTemplateChange = (val: string) => {
    setTemplate(val);
    setMessage(DEFAULT_TEMPLATES[val] ?? DEFAULT_TEMPLATES.default);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const eligible = pendingRecords.filter(r => !sent.has(r.id));
    if (selected.size === eligible.length && eligible.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map(r => r.id)));
    }
  };

  const handleSend = () => {
    if (selected.size === 0) {
      toast({ title: "No students selected", description: "Select at least one student.", variant: "destructive" });
      return;
    }

    // For each selected, build personalised message and open WhatsApp / log SMS
    if (channel === "whatsapp") {
      selected.forEach(id => {
        const r = pendingRecords.find(x => x.id === id);
        if (!r) return;
        const msg = message
          .replace("{name}",    r.displayName)
          .replace("{balance}", (r.balance ?? 0).toLocaleString("en-IN"))
          .replace("{class}",   r.class ?? "")
          .replace("{dueDate}", r.dueDate ?? "");
        // Opens WhatsApp — works if phone is stored on the fee record
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
      });
    }

    setSent(prev => new Set([...prev, ...selected]));
    toast({
      title: `Reminders Sent via ${channel === "whatsapp" ? "WhatsApp" : "SMS"}`,
      description: `Reminder sent to ${selected.size} student${selected.size > 1 ? "s" : ""}.`,
    });
    setSelected(new Set());
  };

  const overdueCount  = useMemo(() => pendingRecords.filter(r => r.isOverdue).length, [pendingRecords]);
  const totalBalance  = useMemo(() => pendingRecords.reduce((s, r) => s + (r.balance ?? 0), 0), [pendingRecords]);
  const eligibleCount = pendingRecords.filter(r => !sent.has(r.id)).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Fees Reminder" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/fees/collect" className="hover:text-[#0D7C8F]">Fees</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Fees Reminder</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">Fees Reminder</h2>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-3">
          <div className="bg-white rounded-lg border shadow-sm px-4 py-2 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Outstanding</p>
              <p className="text-sm font-bold text-red-600">{fmt(totalBalance)}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border shadow-sm px-4 py-2 flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-sm font-bold text-amber-600">{overdueCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border shadow-sm px-4 py-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Reminders Sent</p>
              <p className="text-sm font-bold text-green-600">{sent.size} today</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — student list */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter bar */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-4 flex flex-wrap gap-3 items-center">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {[
                  { value: "all",      label: `All Dues (${allFees.filter(r => (r.balance ?? 0) > 0).length})` },
                  { value: "overdue",  label: `Overdue (${overdueCount})` },
                  { value: "upcoming", label: `Upcoming (${allFees.filter(r => (r.balance ?? 0) > 0 && r.dueDate && r.dueDate >= today).length})` },
                ].map(opt => (
                  <Button
                    key={opt.value}
                    variant={filterType === opt.value ? "default" : "outline"}
                    size="sm"
                    className={filterType === opt.value ? "bg-[#1E2A4A]" : ""}
                    onClick={() => { setFilterType(opt.value); setSelected(new Set()); }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 border-b py-3 px-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selected.size === eligibleCount && eligibleCount > 0}
                    onCheckedChange={toggleAll}
                  />
                  <CardTitle className="text-sm font-semibold">
                    {selected.size > 0 ? `${selected.size} selected` : "Select All"}
                  </CardTitle>
                </div>
                {selected.size > 0 && (
                  <Badge className="bg-[#0D7C8F] text-white">{selected.size} to send</Badge>
                )}
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : pendingRecords.length > 0 ? pendingRecords.map(r => (
                      <TableRow
                        key={r.id}
                        className={`hover:bg-slate-50/50 ${selected.has(r.id) ? "bg-blue-50/50" : ""} ${r.isOverdue ? "bg-red-50/30" : ""}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selected.has(r.id)}
                            onCheckedChange={() => toggleSelect(r.id)}
                            disabled={sent.has(r.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-sm text-[#1E2A4A]">{r.displayName}</p>
                          {r.billNo && <p className="text-xs text-muted-foreground font-mono">{r.billNo}</p>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.class ? `Class ${r.class}` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          {fmt(r.balance)}
                        </TableCell>
                        <TableCell className={`text-xs ${r.isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                          {r.dueDate ?? "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {sent.has(r.id)
                            ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1 text-xs"><CheckCircle2 className="h-3 w-3" /> Sent</Badge>
                            : r.isOverdue
                            ? <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Overdue</Badge>
                            : <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Pending</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Bell className="h-8 w-8 opacity-20" />
                            <p>No pending fee records{filterType !== "all" ? ` (${filterType})` : ""}.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Right — compose panel */}
          <div className="space-y-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#0D7C8F]" /> Compose Reminder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Send Via</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={channel === "whatsapp" ? "default" : "outline"}
                      className={`flex-1 gap-2 ${channel === "whatsapp" ? "bg-green-600 hover:bg-green-700" : ""}`}
                      onClick={() => setChannel("whatsapp")}
                    >
                      <MessageSquare className="h-4 w-4" /> WhatsApp
                    </Button>
                    <Button
                      variant={channel === "sms" ? "default" : "outline"}
                      className={`flex-1 gap-2 ${channel === "sms" ? "bg-[#1E2A4A]" : ""}`}
                      onClick={() => setChannel("sms")}
                    >
                      <Phone className="h-4 w-4" /> SMS
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Template</Label>
                  <Select value={template} onValueChange={handleTemplateChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Reminder</SelectItem>
                      <SelectItem value="overdue">Overdue Notice</SelectItem>
                      <SelectItem value="final">Final Notice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Message</Label>
                  <Textarea
                    className="text-xs h-36 resize-none"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables: {"{name}"} {"{balance}"} {"{class}"} {"{dueDate}"}
                  </p>
                </div>

                <Button
                  className="w-full gap-2 bg-[#0D7C8F] hover:bg-[#1E2A4A]"
                  onClick={handleSend}
                  disabled={selected.size === 0}
                >
                  <Send className="h-4 w-4" />
                  Send to {selected.size > 0 ? `${selected.size} student${selected.size > 1 ? "s" : ""}` : "selected"}
                </Button>

                <div className="border rounded-lg p-3 space-y-2 bg-slate-50">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Summary</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total pending</span>
                    <span className="font-semibold">{pendingRecords.length} students</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Overdue</span>
                    <span className="font-semibold text-red-600">{overdueCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Reminders sent</span>
                    <span className="font-semibold text-green-600">{sent.size} today</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Selected</span>
                    <span className="font-semibold text-[#0D7C8F]">{selected.size}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
