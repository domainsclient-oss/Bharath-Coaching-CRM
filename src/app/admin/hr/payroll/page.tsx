"use client";

import { useState, useMemo } from "react";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument } from "@/services/firestoreService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { IndianRupee, Banknote, Landmark, WalletCards, Users } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { toast } from "@/hooks/use-toast";

interface StaffDoc {
  id: string;
  staffId?: string;
  name: string;
  role: string;
  status: string;
  salary?: number;
  branchId: string;
}

interface PayrollDoc {
  id: string;
  staffId: string;
  monthYear: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: "Paid" | "Unpaid";
  branchId: string;
  processedDate?: string;
}

const PayrollPage = () => {
  const { currentBranch } = useBranch();
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(today.getFullYear());
  const [paymentStaff,  setPaymentStaff]  = useState<StaffDoc | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({ bonus: "0", deductions: "0" });
  const [processing, setProcessing] = useState(false);

  const { data: allStaff, loading: staffLoading } = useFirestoreCollection<StaffDoc>(
    "staff", currentBranch,
  );
  const { data: payrollDocs, loading: payrollLoading } = useFirestoreCollection<PayrollDoc>(
    "payroll", currentBranch,
  );

  const activeStaff = useMemo(
    () => allStaff.filter(s => s.status === "Active"),
    [allStaff],
  );

  const monthYear = useMemo(
    () => `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`,
    [selectedYear, selectedMonth],
  );

  const staffPayrollData = useMemo(() => {
    return activeStaff.map(s => {
      const base = s.salary ?? 0;
      const entry = payrollDocs.find(p => p.staffId === s.id && p.monthYear === monthYear);
      return {
        staff: s,
        payroll: entry ?? {
          id: "",
          staffId: s.id,
          monthYear,
          baseSalary: base,
          bonus: 0,
          deductions: 0,
          netSalary: base,
          status: "Unpaid" as const,
          branchId: currentBranch,
        },
      };
    });
  }, [activeStaff, payrollDocs, monthYear, currentBranch]);

  const summary = useMemo(() => {
    const total   = staffPayrollData.reduce((s, p) => s + p.payroll.netSalary, 0);
    const paid    = staffPayrollData.filter(p => p.payroll.status === "Paid").reduce((s, p) => s + p.payroll.netSalary, 0);
    const paidCnt = staffPayrollData.filter(p => p.payroll.status === "Paid").length;
    return { total, paid, pending: total - paid, paidCnt };
  }, [staffPayrollData]);

  const handleProcessPayment = async () => {
    if (!paymentStaff) return;
    setProcessing(true);
    try {
      const bonus      = parseFloat(paymentDetails.bonus)      || 0;
      const deductions = parseFloat(paymentDetails.deductions) || 0;
      const baseSalary = paymentStaff.salary ?? 0;
      const netSalary  = baseSalary + bonus - deductions;

      const payload: Omit<PayrollDoc, "id"> = {
        staffId:       paymentStaff.id,
        monthYear,
        baseSalary,
        bonus,
        deductions,
        netSalary,
        status:        "Paid",
        processedDate: new Date().toISOString(),
        branchId:      currentBranch,
      };

      // Update if existing record exists, otherwise add new
      const existing = payrollDocs.find(p => p.staffId === paymentStaff.id && p.monthYear === monthYear);
      if (existing) {
        await updateDocument("payroll", existing.id, payload);
      } else {
        await addDocument("payroll", payload);
      }

      toast({ title: "Payment Processed", description: `₹${netSalary.toLocaleString("en-IN")} paid to ${paymentStaff.name}.` });
      setPaymentStaff(null);
      setPaymentDetails({ bonus: "0", deductions: "0" });
    } catch (err) {
      console.error("Payment failed:", err);
      toast({ title: "Error", description: "Could not process payment.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const isLoading = staffLoading || payrollLoading;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Staff Payroll" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-[#1E2A4A]">Staff Payroll</h1>
          <div className="flex items-center gap-3">
            <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => (
                  <SelectItem key={i} value={String(today.getFullYear() - i)}>
                    {today.getFullYear() - i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users,      title: "Total Staff",     value: `${staffPayrollData.length}`,                                    bg: "bg-blue-100",   iconCls: "text-blue-800"  },
            { icon: Banknote,   title: "Total Salary",    value: `₹${summary.total.toLocaleString("en-IN")}`,                     bg: "bg-green-100",  iconCls: "text-green-800" },
            { icon: Landmark,   title: "Salary Paid",     value: `₹${summary.paid.toLocaleString("en-IN")}`,                     bg: "bg-yellow-100", iconCls: "text-yellow-800"},
            { icon: WalletCards,title: "Salary Pending",  value: `₹${summary.pending.toLocaleString("en-IN")}`,                  bg: "bg-red-100",    iconCls: "text-red-800"   },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.title}>
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className={`p-3 rounded-full ${c.bg}`}><Icon size={24} className={c.iconCls} /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">{c.title}</p>
                    <p className="text-xl font-bold">{c.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Payroll for {new Date(selectedYear, selectedMonth - 1).toLocaleString("default", { month: "long", year: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : activeStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No active staff found for {currentBranch}. Add staff under HR → Staff Directory.
                    </TableCell>
                  </TableRow>
                ) : staffPayrollData.map(({ staff, payroll }) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-mono text-xs">{staff.staffId ?? staff.id}</TableCell>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell>{staff.role}</TableCell>
                    <TableCell>₹{payroll.baseSalary.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="font-bold">₹{payroll.netSalary.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <Badge variant={payroll.status === "Paid" ? "default" : "destructive"}>
                        {payroll.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payroll.status === "Unpaid" ? (
                        <Button size="sm" onClick={() => { setPaymentStaff(staff); setPaymentDetails({ bonus: "0", deductions: "0" }); }}>
                          Pay Now
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Paid on {payroll.processedDate ? new Date(payroll.processedDate).toLocaleDateString("en-IN") : "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment dialog */}
        <Dialog open={!!paymentStaff} onOpenChange={v => { if (!v) setPaymentStaff(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payment for {paymentStaff?.name}</DialogTitle>
              <DialogDescription>
                Month: {new Date(selectedYear, selectedMonth - 1).toLocaleString("default", { month: "long", year: "numeric" })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 items-center">
                <Label>Base Salary</Label>
                <p className="font-bold">₹{(paymentStaff?.salary ?? 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="grid grid-cols-2 items-center gap-2">
                <Label htmlFor="bonus">Bonus / Incentives</Label>
                <Input id="bonus" type="number" min="0" value={paymentDetails.bonus}
                  onChange={e => setPaymentDetails(p => ({ ...p, bonus: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 items-center gap-2">
                <Label htmlFor="deductions">Deductions</Label>
                <Input id="deductions" type="number" min="0" value={paymentDetails.deductions}
                  onChange={e => setPaymentDetails(p => ({ ...p, deductions: e.target.value }))} />
              </div>
              <hr />
              <div className="grid grid-cols-2 items-center text-lg">
                <Label>Net Salary</Label>
                <p className="font-bold text-green-700">
                  ₹{(
                    (paymentStaff?.salary ?? 0)
                    + (parseFloat(paymentDetails.bonus) || 0)
                    - (parseFloat(paymentDetails.deductions) || 0)
                  ).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={processing}>Cancel</Button></DialogClose>
              <Button onClick={handleProcessPayment} disabled={processing}>
                <IndianRupee className="mr-2 h-4 w-4" />
                {processing ? "Processing..." : "Confirm Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default PayrollPage;
