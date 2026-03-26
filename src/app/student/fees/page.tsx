
'use client';

import { useState, useEffect } from 'react';
import { feeService, paymentService } from '../../../services/firestoreService';
import { useAuth } from '../../../context/AuthContext';
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
  const { user } = useAuth();
  const studentId = user?.id;

  useEffect(() => {
    if (!studentId) {
        setLoading(false);
        setError("Please log in to view your fee details.");
        return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both fees and payments for the student
        const feeList = await feeService.query([
          { field: 'studentId', operator: '==', value: studentId }
        ], { field: 'dueDate', direction: 'desc' });
        
        const paymentList = await paymentService.query([
            { field: 'studentId', operator: '==', value: studentId }
        ], { field: 'paymentDate', direction: 'desc' });

        setFees(feeList as Fee[]);
        setPayments(paymentList as Payment[]);

      } catch (err) {
        console.error("Failed to load fee data:", err);
        setError("Failed to load your fee information. Please contact the office.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

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
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Fees & Payments</h1>
      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-6">{error}</p>}

      <Card className="mb-8">
        <CardHeader><CardTitle>My Fee Dues</CardTitle></CardHeader>
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

      <Card>
        <CardHeader><CardTitle>My Payment History</CardTitle></CardHeader>
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
