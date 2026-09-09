
'use client';

import { useState, useEffect } from 'react';
import { feeService, paymentService } from '../../../services/firestoreService';
import { useStudentRecord } from '@/hooks/useStudentRecord';
import type { Fee } from '../../../models/fee';
import type { Payment } from '../../../models/payment';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';

export default function StudentFeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { studentId, loading: recordLoading, unlinked } = useStudentRecord();

  useEffect(() => {
    if (recordLoading) return;

    if (unlinked || !studentId) {
        setLoading(false);
        return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both fees and payments for the student
        const [feeList, paymentList] = await Promise.all([
          feeService.query([{ field: 'studentId', operator: '==', value: studentId }]),
          paymentService.query([{ field: 'studentId', operator: '==', value: studentId }]),
        ]);

        // Sorted here rather than in the query so no composite index is needed.
        const newestFirst = (field: string) => (a: any, b: any) =>
          String(b?.[field] ?? '').localeCompare(String(a?.[field] ?? ''));

        setFees([...feeList].sort(newestFirst('dueDate')) as Fee[]);
        setPayments([...paymentList].sort(newestFirst('paymentDate')) as Payment[]);

      } catch (err) {
        console.error("Failed to load fee data:", err);
        setError("Failed to load your fee information. Please contact the office.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, recordLoading, unlinked]);

  const getStatusBadge = (status: Fee['status']) => {
    switch (status) {
      case 'Paid': return <Badge variant="default">Paid</Badge>;
      case 'Partially Paid': return <Badge variant="secondary">Partially Paid</Badge>;
      case 'Unpaid': return <Badge variant="destructive">Unpaid</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    return new Date(date.seconds * 1000).toLocaleDateString();
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1E2A4A]">My Fees &amp; Payments</h1>
        <p className="text-muted-foreground">What is owed, and what has been paid.</p>
      </div>

      {unlinked && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl">
          Your login is not linked to a student record yet. Please contact your branch office.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">{error}</div>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-lg font-bold text-[#1E2A4A]">My Fee Dues</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
              ) : (
                fees.map(fee => (
                  <TableRow key={fee.id}>
                    <TableCell>{fee.description}</TableCell>
                    <TableCell>{formatDate(fee.dueDate)}</TableCell>
                    <TableCell>₹{fee.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>₹{fee.amountPaid.toLocaleString()}</TableCell>
                    <TableCell>₹{fee.balance.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(fee.status)}</TableCell>
                  </TableRow>
                ))
              )}
              {!loading && fees.length === 0 && <TableRow><TableCell colSpan={6} className="text-center">No outstanding fees found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-lg font-bold text-[#1E2A4A]">My Payment History</CardTitle></CardHeader>
        <CardContent>
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No.</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Payment Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
              ) : (
                payments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.receiptNumber}</TableCell>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                  </TableRow>
                ))
              )}
              {!loading && payments.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">No payment history found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
