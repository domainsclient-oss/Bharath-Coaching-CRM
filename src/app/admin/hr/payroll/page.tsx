
"use client";

import { useState, useMemo } from 'react';
import { mockStaff, Staff, mockPayroll, Payroll } from "@/data/hrData";
import { useBranchData } from "@/hooks/use-branch-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IndianRupee, Banknote, Landmark, WalletCards, Users } from 'lucide-react';

const PayrollPage = () => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const { data: staff } = useBranchData<Staff>(mockStaff);
  const { data: payroll, setData: setPayroll } = useBranchData<Payroll>(mockPayroll);

  const [paymentStaff, setPaymentStaff] = useState<Staff | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({ bonus: '0', deductions: '0' });

  const activeStaff = useMemo(() => staff.filter(s => s.status === 'Active'), [staff]);

  const staffPayrollData = useMemo(() => {
    const monthYear = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    return activeStaff.map(s => {
      const payrollEntry = payroll.find(p => p.staffId === s.id && p.monthYear === monthYear);
      return {
        staff: s,
        payroll: payrollEntry || {
            id: ``, staffId: s.id, monthYear,
            baseSalary: s.salary, deductions: 0, bonus: 0,
            netSalary: s.salary, status: "Unpaid", branchId: s.branchId
        },
      };
    });
  }, [activeStaff, payroll, selectedMonth, selectedYear]);

  const payrollSummary = useMemo(() => {
    const totalStaff = staffPayrollData.length;
    const paidCount = staffPayrollData.filter(p => p.payroll.status === 'Paid').length;
    const totalSalary = staffPayrollData.reduce((sum, p) => sum + p.payroll.netSalary, 0);
    const paidSalary = staffPayrollData
        .filter(p => p.payroll.status === 'Paid')
        .reduce((sum, p) => sum + p.payroll.netSalary, 0);
    return { totalStaff, paidCount, totalSalary, paidSalary };
  }, [staffPayrollData]);

  const handleOpenPayment = (staff: Staff) => {
    setPaymentStaff(staff);
  };

  const handleProcessPayment = () => {
    if (!paymentStaff) return;
    const bonus = parseFloat(paymentDetails.bonus) || 0;
    const deductions = parseFloat(paymentDetails.deductions) || 0;
    const baseSalary = paymentStaff.salary;
    const netSalary = baseSalary + bonus - deductions;
    const monthYear = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    const newPayment: Payroll = {
      id: `PAY${Date.now()}`,
      staffId: paymentStaff.id,
      monthYear,
      baseSalary,
      bonus,
      deductions,
      netSalary,
      status: "Paid",
      processedDate: new Date().toISOString(),
      branchId: paymentStaff.branchId,
    };
    
    setPayroll(prev => [...prev.filter(p => !(p.staffId === paymentStaff.id && p.monthYear === monthYear)), newPayment]);
    setPaymentStaff(null);
    setPaymentDetails({ bonus: '0', deductions: '0' });
  }
  
  const SummaryCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) => (
      <Card>
          <CardContent className="pt-6 flex items-center space-x-4">
              <div className={`p-3 rounded-full ${color}`}> {icon}</div>
              <div>
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <p className="text-xl font-bold">{value}</p>
              </div>
          </CardContent>
      </Card>
  )

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Staff Payroll</h1>
            <div className="flex items-center space-x-4">
                <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
                    <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
                    <SelectContent>{Array.from({length:12},(_,i) => <SelectItem key={i} value={String(i+1)}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
                    <SelectTrigger className="w-[120px]"><SelectValue/></SelectTrigger>
                    <SelectContent>{Array.from({length:5},(_,i) => <SelectItem key={i} value={String(today.getFullYear()-i)}>{today.getFullYear()-i}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard icon={<Users size={24} className="text-blue-800" />} title="Total Staff" value={`${staffPayrollData.length}`} color="bg-blue-100" />
            <SummaryCard icon={<Banknote size={24} className="text-green-800" />} title="Total Salary" value={`₹${payrollSummary.totalSalary.toLocaleString('en-IN')}`} color="bg-green-100" />
            <SummaryCard icon={<Landmark size={24} className="text-yellow-800" />} title="Salary Paid" value={`₹${payrollSummary.paidSalary.toLocaleString('en-IN')}`} color="bg-yellow-100" />
            <SummaryCard icon={<WalletCards size={24} className="text-red-800" />} title="Salary Pending" value={`₹${(payrollSummary.totalSalary - payrollSummary.paidSalary).toLocaleString('en-IN')}`} color="bg-red-100" />
       </div>

        <Card>
            <CardHeader><CardTitle>Payroll for {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Staff ID</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Base Salary</TableHead><TableHead>Net Salary</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {staffPayrollData.map(({ staff, payroll }) => (
                            <TableRow key={staff.id}>
                                <TableCell>{staff.staffId}</TableCell>
                                <TableCell>{staff.name}</TableCell>
                                <TableCell>{staff.role}</TableCell>
                                <TableCell>₹{payroll.baseSalary.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="font-bold">₹{payroll.netSalary.toLocaleString('en-IN')}</TableCell>
                                <TableCell><Badge variant={payroll.status === 'Paid' ? 'default' : 'destructive'}>{payroll.status}</Badge></TableCell>
                                <TableCell>
                                    {payroll.status === 'Unpaid' ? (
                                        <Button size="sm" onClick={() => handleOpenPayment(staff)}>Pay Now</Button>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Paid on {payroll.processedDate ? new Date(payroll.processedDate).toLocaleDateString() : 'N/A'}</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Dialog open={!!paymentStaff} onOpenChange={() => setPaymentStaff(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Process Payment for {paymentStaff?.name}</DialogTitle>
                    <DialogDescription>
                        Month: {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 items-center">
                        <Label>Base Salary</Label>
                        <p className="font-bold">₹{paymentStaff?.salary.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="grid grid-cols-2 items-center">
                        <Label htmlFor="bonus">Bonus / Incentives</Label>
                        <Input id="bonus" type="number" value={paymentDetails.bonus} onChange={e => setPaymentDetails({ ...paymentDetails, bonus: e.target.value })}/>
                    </div>
                     <div className="grid grid-cols-2 items-center">
                        <Label htmlFor="deductions">Deductions</Label>
                        <Input id="deductions" type="number" value={paymentDetails.deductions} onChange={e => setPaymentDetails({ ...paymentDetails, deductions: e.target.value })}/>
                    </div>
                    <hr className="my-4"/>
                     <div className="grid grid-cols-2 items-center text-lg">
                        <Label>Net Salary</Label>
                        <p className="font-bold">₹{( (paymentStaff?.salary || 0) + parseFloat(paymentDetails.bonus || '0') - parseFloat(paymentDetails.deductions || '0') ).toLocaleString('en-IN')}</p>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleProcessPayment}><IndianRupee className="mr-2 h-4 w-4"/> Confirm Payment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

export default PayrollPage;
