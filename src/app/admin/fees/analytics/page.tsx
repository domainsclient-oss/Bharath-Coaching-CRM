
"use client";

import { useAuth } from "@/app/auth-provider";
import { AccessDenied } from "@/components/auth/access-denied";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockFeeRecords, FeeRecord } from "@/data/feesData";
import { mockStudents } from "@/data/studentsData";
import { mockBranches, Branch } from "@/data/branchData"; // Assuming you have this
import { useMemo } from "react";
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Line, LineChart } from 'recharts';
import { IndianRupee, Landmark, TrendingDown, TrendingUp, Users } from "lucide-react";

const FeeAnalyticsPage = () => {
  const { user } = useAuth();

  // In a real app, you would fetch all data for super_admin
  const allFeeRecords = mockFeeRecords;
  const allStudents = mockStudents;
  const allBranches = mockBranches;

  const analytics = useMemo(() => {
    const totalCollectedYTD = allFeeRecords.reduce((sum, r) => sum + r.collected, 0);
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const collectedThisMonth = allFeeRecords
      .flatMap(r => Object.values(r.instalments).filter(i => i?.collected))
      .filter(i => {
          const iDate = new Date(i!.date);
          return iDate.getMonth() === thisMonth && iDate.getFullYear() === thisYear;
      })
      .reduce((sum, i) => sum + i!.amount, 0);
    
    const totalOutstanding = allFeeRecords.reduce((sum, r) => sum + r.balance, 0);
    const defaulters = new Set(allFeeRecords.filter(r => r.balance > 0 && r.nextPaymentDate && new Date(r.nextPaymentDate) < new Date()).map(r => r.studentId)).size;

    const monthlyCollection = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { month: d.toLocaleString('default', { month: 'short' }), amount: 0 };
    }).reverse();

    allFeeRecords.flatMap(r => Object.values(r.instalments).filter(i => i?.collected)).forEach(i => {
        const iDate = new Date(i!.date);
        const monthStr = iDate.toLocaleString('default', { month: 'short' });
        const monthEntry = monthlyCollection.find(m => m.month === monthStr);
        if(monthEntry) monthEntry.amount += i!.amount;
    });

    const paymentModes = allFeeRecords
        .flatMap(r => Object.values(r.instalments).filter(i => i?.collected))
        .reduce((acc, i) => {
            acc[i!.mode] = (acc[i!.mode] || 0) + i!.amount;
            return acc;
        }, {} as Record<string, number>);

    const outstandingTrend = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { month: d.toLocaleString('default', { month: 'short' }), amount: Math.random() * 50000 }; // Mock trend
    }).reverse();

    const branchData = allBranches.map(branch => {
        const branchStudents = allStudents.filter(s => s.branchId === branch.id);
        const branchFees = allFeeRecords.filter(f => f.branchId === branch.id);
        const totalFees = branchFees.reduce((s,f) => s + f.totalFee, 0)
        const collected = branchFees.reduce((s,f) => s + f.collected, 0)
        const outstanding = branchFees.reduce((s,f) => s + f.balance, 0)
        const collectionPercentage = totalFees > 0 ? (collected / totalFees) * 100 : 0;
        return {
            name: branch.name,
            totalStudents: branchStudents.length,
            totalFees,
            collected,
            outstanding,
            collectionPercentage
        }
    })

    return { totalCollectedYTD, collectedThisMonth, totalOutstanding, defaulters, monthlyCollection, paymentModes, outstandingTrend, branchData };
  }, [allFeeRecords, allStudents, allBranches]);

  if (user?.role !== 'super_admin') {
    return <AccessDenied />;
  }
  
  const COLORS = ['#0D7C8F', '#1E2A4A', '#FFC107', '#28A745'];

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Collected (YTD)</CardTitle><TrendingUp/></CardHeader><CardContent><div className="text-2xl font-bold">{analytics.totalCollectedYTD.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Collected (This Month)</CardTitle><IndianRupee/></CardHeader><CardContent><div className="text-2xl font-bold">{analytics.collectedThisMonth.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Total Outstanding</CardTitle><TrendingDown/></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{analytics.totalOutstanding.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Defaulters</CardTitle><Users/></CardHeader><CardContent><div className="text-2xl font-bold">{analytics.defaulters}</div></CardContent></Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
                <CardHeader><CardTitle>Monthly Collection (Last 6 Months)</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.monthlyCollection}>
                            <XAxis dataKey="month" /><YAxis tickFormatter={(val) => `${val/1000}k`} />
                            <Tooltip formatter={(value: number) => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} />
                            <Bar dataKey="amount" fill="#0D7C8F" />
                        </BarChart>
                    </responsivecontainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Payment Mode Breakdown</CardTitle></CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={Object.entries(analytics.paymentModes).map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {Object.keys(analytics.paymentModes).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Legend />
                            <Tooltip formatter={(value: number) => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader><CardTitle>Branch Comparison</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Branch Name</TableHead><TableHead>Students</TableHead><TableHead>Total Billed</TableHead><TableHead>Collected</TableHead><TableHead>Outstanding</TableHead><TableHead>Collection %</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {analytics.branchData.map(b => (
                            <TableRow key={b.name}>
                                <TableCell>{b.name}</TableCell>
                                <TableCell>{b.totalStudents}</TableCell>
                                <TableCell>{b.totalFees.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                <TableCell className="text-green-600">{b.collected.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                <TableCell className="text-red-600">{b.outstanding.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                <TableCell>{b.collectionPercentage.toFixed(2)}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}

export default FeeAnalyticsPage;
