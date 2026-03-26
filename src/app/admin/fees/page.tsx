
'use client';

import { useState, useEffect } from 'react';
import { feeService, paymentService } from '../../../services/firestoreService';
import { useBranchData } from '../../../context/BranchContext';
import type { Fee } from '../../../models/fee';
import type { Payment } from '../../../models/payment';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { toast } from '../../../components/ui/use-toast';
import { Badge } from '../../../components/ui/badge';

// Assume a FeeForm component exists for adding/editing fees
// import { FeeForm } from './_components/FeeForm';

export default function FeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { branchId } = useBranchData();

  useEffect(() => {
    if (!branchId) return;

    const fetchFees = async () => {
      try {
        setLoading(true);
        setError(null);
        const feeList = await feeService.query([
          { field: 'branchId', operator: '==', value: branchId }
        ], { field: 'dueDate', direction: 'desc' });
        setFees(feeList as Fee[]);
      } catch (err) {
        console.error("Failed to load fees:", err);
        setError("Failed to load fee data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [branchId]);

  const handleAddFee = async (formData: Omit<Fee, 'id'>) => {
    try {
      const newFee = await feeService.add({ ...formData, branchId });
      setFees(prev => [newFee as Fee, ...prev]);
      toast({ title: "Success", description: "Fee record created." });
    } catch (err) {
      console.error("Error adding fee:", err);
      toast({ title: "Error", description: "Could not create fee record.", variant: "destructive" });
    }
  };

  const handleRecordPayment = async (fee: Fee, paymentAmount: number) => {
    if (paymentAmount <= 0 || paymentAmount > fee.balance) {
        toast({ title: "Invalid Amount", description: "Payment amount is not valid.", variant: "destructive" });
        return;
    }

    try {
        // 1. Record the payment
        const newPayment: Omit<Payment, 'id'> = {
            branchId,
            studentId: fee.studentId,
            feeId: fee.id,
            amount: paymentAmount,
            paymentDate: new Date(),
            paymentMethod: 'Cash', // Example
            receiptNumber: `RCPT-${Date.now()}`, // Example
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await paymentService.add(newPayment);

        // 2. Update the fee balance
        const newAmountPaid = fee.amountPaid + paymentAmount;
        const newBalance = fee.totalAmount - newAmountPaid;
        const newStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';

        await feeService.update(fee.id, { 
            amountPaid: newAmountPaid, 
            balance: newBalance,
            status: newStatus
        });

        // 3. Update local state
        setFees(fees.map(f => f.id === fee.id ? { ...f, amountPaid: newAmountPaid, balance: newBalance, status: newStatus } : f));
        toast({ title: "Success", description: "Payment recorded." });

    } catch (err) {
        console.error("Error recording payment:", err);
        toast({ title: "Error", description: "Could not record payment.", variant: "destructive" });
    }
  }

  const getStatusBadge = (status: Fee['status']) => {
    switch (status) {
      case 'Paid': return <Badge variant="default">Paid</Badge>;
      case 'Partially Paid': return <Badge variant="secondary">Partially Paid</Badge>;
      case 'Unpaid': return <Badge variant="destructive">Unpaid</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fee Management</h1>
        <Button onClick={() => alert('Open form to add fee record') }>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Fee Record
        </Button>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

      <Card>
        <CardHeader><CardTitle>Fee Records</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                            </TableRow>
                        ))
                    ) : (
                        fees.map(fee => (
                            <TableRow key={fee.id}>
                                <TableCell>{fee.studentId}</TableCell>
                                <TableCell>{fee.description}</TableCell>
                                <TableCell>₹{fee.totalAmount.toLocaleString()}</TableCell>
                                <TableCell>₹{fee.amountPaid.toLocaleString()}</TableCell>
                                <TableCell>₹{fee.balance.toLocaleString()}</TableCell>
                                <TableCell>{getStatusBadge(fee.status)}</TableCell>
                                <TableCell>
                                    <Button size="sm" onClick={() => handleRecordPayment(fee, 500)} disabled={fee.status === 'Paid'}>Record Payment</Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            {!loading && fees.length === 0 && <p className="p-4">No fee records found for this branch.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
