"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Search, IndianRupee, CreditCard, Check, PlusCircle } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { updateDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface FeeDoc {
  id: string;
  studentName?: string;
  name?: string;
  class?: string;
  board?: string;
  subjects?: string[];
  billNo?: string;
  feeType?: string;
  totalFee: number;
  amountPaid: number;
  balance: number;
  status: string;
  paymentDate?: string | null;
  dueDate?: string;
  mode?: string | null;
  branchId: string;
}

type PaymentMode = "Cash" | "UPI" | "Cheque" | "NEFT";

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CollectFeesPage() {
  const { currentBranch } = useBranch();
  const [name, setName] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [boardFilter, setBoardFilter] = useState("");
  const [searched, setSearched] = useState(false);

  const { data: allRecords } = useFirestoreCollection<FeeDoc>("fees", currentBranch);

  // Collect payment dialog
  const [collectRecord, setCollectRecord] = useState<FeeDoc | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<PaymentMode>("Cash");
  const [payDate, setPayDate] = useState(localToday());
  const [saving, setSaving] = useState(false);

  const records = useMemo(() => {
    if (!searched) return [];
    return allRecords.filter(r =>
      (!name || (r.studentName ?? r.name ?? "").toLowerCase().includes(name.toLowerCase())) &&
      (!classFilter || (r.class ?? "").includes(classFilter)) &&
      (!boardFilter || (r.board ?? "").toLowerCase().includes(boardFilter.toLowerCase()))
    );
  }, [searched, allRecords, name, classFilter, boardFilter]);

  const fmt = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

  const openCollect = (r: FeeDoc) => {
    if ((r.balance ?? 0) <= 0) {
      toast({ title: "Fully Paid", description: `${r.studentName ?? r.name} has no balance.` });
      return;
    }
    setCollectRecord(r);
    setPayAmount(String(r.balance ?? ""));
    setPayMode("Cash");
    setPayDate(localToday());
  };

  const handleCollect = async () => {
    if (!collectRecord) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Enter a valid payment amount.", variant: "destructive" });
      return;
    }
    if (amount > (collectRecord.balance ?? 0)) {
      toast({ title: "Excess Amount", description: "Payment cannot exceed balance.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const newAmountPaid = (collectRecord.amountPaid ?? 0) + amount;
      const newBalance = (collectRecord.totalFee ?? 0) - newAmountPaid;
      const newStatus = newBalance <= 0 ? "Paid" : "Partially Paid";

      await updateDocument("fees", collectRecord.id, {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
        paymentDate: payDate,
        mode: payMode,
      });

      toast({
        title: "Payment Collected",
        description: `${fmt(amount)} collected from ${collectRecord.studentName ?? collectRecord.name} via ${payMode}.`,
      });
      setCollectRecord(null);
    } catch {
      toast({ title: "Error", description: "Could not save payment.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = () => setSearched(true);
  const handleClear = () => {
    setSearched(false);
    setName(""); setClassFilter(""); setBoardFilter("");
  };

  const STATUS_COLORS: Record<string, string> = {
    "Paid":           "bg-green-100 text-green-700",
    "Partially Paid": "bg-amber-100 text-amber-700",
    "Unpaid":         "bg-red-100 text-red-700",
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Collect Fees" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/fees" className="hover:text-[#0D7C8F]">Fees</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Collect Fees</span>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Collect Fees</h2>
          <Link href="/admin/fees/add">
            <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
              <PlusCircle className="h-4 w-4" /> Add Fee Record
            </Button>
          </Link>
        </div>

        {/* Filter bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">Student Name</p>
                <Input className="w-48" placeholder="Search name..." value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">Class</p>
                <Input className="w-24" placeholder="e.g. 10" value={classFilter}
                  onChange={e => setClassFilter(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">Board</p>
                <Input className="w-28" placeholder="e.g. CBSE" value={boardFilter}
                  onChange={e => setBoardFilter(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()} />
              </div>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={handleSearch}>
                <Search className="h-4 w-4" /> Search
              </Button>
              {searched && (
                <Button variant="outline" onClick={handleClear}>Clear</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b py-3 px-6">
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-[#0D7C8F]" />
                {records.length} Record{records.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead className="text-right">Total Fee</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length > 0 ? records.map(r => (
                    <TableRow key={r.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-sm text-[#1E2A4A]">
                        {r.studentName ?? r.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.class ? `Class ${r.class}` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.billNo ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.totalFee)}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {fmt(r.amountPaid)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${(r.balance ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                        {fmt(r.balance)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.dueDate ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {(r.balance ?? 0) > 0 ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-[#0D7C8F] hover:bg-[#0a6275] gap-1"
                            onClick={() => openCollect(r)}
                          >
                            <CreditCard className="h-3 w-3" /> Collect
                          </Button>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                            <Check className="h-3 w-3" /> Paid
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <IndianRupee className="h-8 w-8 opacity-20" />
                          <p>No fee records found.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Collect Payment Dialog */}
        <Dialog open={!!collectRecord} onOpenChange={open => { if (!open) setCollectRecord(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#0D7C8F]" /> Collect Payment
              </DialogTitle>
            </DialogHeader>

            {collectRecord && (
              <div className="space-y-4 py-1">
                <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                  <p className="font-semibold text-[#1E2A4A]">
                    {collectRecord.studentName ?? collectRecord.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {collectRecord.billNo && <span>Bill: <span className="font-mono">{collectRecord.billNo}</span> · </span>}
                    Balance: <span className="text-red-600 font-semibold">{fmt(collectRecord.balance)}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Payment Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₹</span>
                    <Input
                      className="pl-7"
                      type="number"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      max={collectRecord.balance}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max: {fmt(collectRecord.balance)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={payMode} onValueChange={v => setPayMode(v as PaymentMode)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["Cash", "UPI", "Cheque", "NEFT"] as PaymentMode[]).map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={payDate}
                    max={localToday()}
                    onChange={e => setPayDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setCollectRecord(null)}>Cancel</Button>
              <Button
                className="bg-[#0D7C8F] hover:bg-[#0a6275]"
                onClick={handleCollect}
                disabled={saving}
              >
                {saving ? "Saving…" : "Confirm Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
