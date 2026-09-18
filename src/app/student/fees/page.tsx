
'use client';

import { useState, useEffect, useMemo } from 'react';
import { feeService, paymentService } from '@/services/firestoreService';
import { useStudentRecord } from '@/hooks/useStudentRecord';
import { formatDate } from '@/lib/firestoreDate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

/**
 * A fee record as the admin screens actually write it.
 *
 * `/admin/fees/add` creates the bill and `/admin/fees/collect` updates it in
 * place as money comes in. The older `Fee` model in `src/models` describes a
 * different shape that was never written, so the two names it used —
 * `totalAmount` and `description` — are kept here only as fallbacks for any
 * record that predates the current screens.
 */
interface FeeRow {
  id: string;
  billNo?: string;
  feeType?: string;
  totalFee?: number;
  /** Legacy spelling of `totalFee`. */
  totalAmount?: number;
  amountPaid?: number;
  balance?: number;
  status?: string;
  dueDate?: any;
  paymentDate?: any;
  /** How the last payment was taken: Cash, UPI, Card, Bank Transfer. */
  mode?: string;
  description?: string;
  subjects?: string[];
}

/** A row in the payment history, whichever source it came from. */
interface PaymentRow {
  id: string;
  receipt: string;
  paidOn: any;
  amount: number;
  method: string;
}

const rupees = (value?: number) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;

const totalOf = (fee: FeeRow) => Number(fee.totalFee ?? fee.totalAmount) || 0;

/** What the bill is for. Falls back through the fields the screens do write. */
const describe = (fee: FeeRow) =>
  fee.description
  || [fee.feeType, (fee.subjects ?? []).join(', ')].filter(Boolean).join(' — ')
  || 'Tuition Fee';

const statusBadge = (fee: FeeRow) => {
  // An older record can carry a stale status, so trust the balance first.
  const balance = Number(fee.balance ?? totalOf(fee) - (Number(fee.amountPaid) || 0));
  const status = balance <= 0 ? 'Paid' : fee.status || 'Unpaid';
  switch (status) {
    case 'Paid': return <Badge className="bg-green-600 hover:bg-green-600">Paid</Badge>;
    case 'Partially Paid': return <Badge variant="secondary">Partially Paid</Badge>;
    case 'Unpaid': return <Badge variant="destructive">Unpaid</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default function StudentFeesPage() {
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
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

        const [feeList, paymentList] = await Promise.all([
          feeService.query([{ field: 'studentId', operator: '==', value: studentId }]),
          // Kept for any branch that records receipts separately. The office
          // screens do not write here today, so this is normally empty and the
          // history below is built from the bills instead.
          paymentService.query([{ field: 'studentId', operator: '==', value: studentId }]).catch(() => []),
        ]);

        // Sorted here rather than in the query so no composite index is needed.
        const newestFirst = (field: string) => (a: any, b: any) =>
          String(b?.[field] ?? '').localeCompare(String(a?.[field] ?? ''));

        setFees([...(feeList as FeeRow[])].sort(newestFirst('dueDate')));

        setPayments(
          (paymentList as any[]).map(p => ({
            id: p.id,
            receipt: p.receiptNumber ?? p.billNo ?? '—',
            paidOn: p.paymentDate,
            amount: Number(p.amount) || 0,
            method: p.paymentMethod ?? p.mode ?? '—',
          })),
        );
      } catch (err) {
        console.error('Failed to load fee data:', err);
        setError('Failed to load your fee information. Please contact the office.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, recordLoading, unlinked]);

  /**
   * The office collects against the bill itself rather than filing a separate
   * receipt, so a bill carrying money is the record that a payment happened.
   * That gives one line per bill showing the total taken against it and the
   * date of the most recent installment, which is all the bill records.
   */
  const history = useMemo<PaymentRow[]>(() => {
    if (payments.length > 0) return payments;
    return fees
      .filter(fee => (Number(fee.amountPaid) || 0) > 0)
      .map(fee => ({
        id: fee.id,
        receipt: fee.billNo ?? '—',
        paidOn: fee.paymentDate ?? fee.dueDate,
        amount: Number(fee.amountPaid) || 0,
        method: fee.mode || '—',
      }))
      .sort((a, b) => String(b.paidOn ?? '').localeCompare(String(a.paidOn ?? '')));
  }, [fees, payments]);

  const summary = useMemo(() => {
    const billed = fees.reduce((sum, f) => sum + totalOf(f), 0);
    const paid = fees.reduce((sum, f) => sum + (Number(f.amountPaid) || 0), 0);
    return { billed, paid, balance: Math.max(0, billed - paid) };
  }, [fees]);

  const busy = loading || recordLoading;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1E2A4A]">My Fees &amp; Payments</h1>
        <p className="text-muted-foreground">What is owed, and what has been paid.</p>
      </div>

      {unlinked && !busy && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl">
          Your login is not linked to a student record yet. Please contact your branch office.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">{error}</div>
      )}

      {/* Where the account stands, before the line by line detail. */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Billed', value: summary.billed, accent: 'text-[#1E2A4A]' },
          { label: 'Paid So Far', value: summary.paid, accent: 'text-green-600' },
          { label: 'Balance Due', value: summary.balance, accent: summary.balance > 0 ? 'text-red-600' : 'text-green-600' },
        ].map(card => (
          <Card key={card.label} className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{card.label}</p>
              {busy
                ? <Skeleton className="mt-2 h-7 w-28" />
                : <p className={`mt-1 text-2xl font-bold ${card.accent}`}>{rupees(card.value)}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-lg font-bold text-[#1E2A4A]">My Fee Dues</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill No</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {busy ? (
                <TableRow><TableCell colSpan={7}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
              ) : fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No fee records have been raised for you yet.
                  </TableCell>
                </TableRow>
              ) : (
                fees.map(fee => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-mono text-xs">{fee.billNo ?? '—'}</TableCell>
                    <TableCell className="font-medium">{describe(fee)}</TableCell>
                    <TableCell>{formatDate(fee.dueDate, '—')}</TableCell>
                    <TableCell className="text-right">{rupees(totalOf(fee))}</TableCell>
                    <TableCell className="text-right">{rupees(fee.amountPaid)}</TableCell>
                    <TableCell className="text-right font-semibold">{rupees(fee.balance)}</TableCell>
                    <TableCell>{statusBadge(fee)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#1E2A4A]">My Payment History</CardTitle>
          <p className="text-xs text-muted-foreground">
            One line per bill, showing everything collected against it and the date of the most recent payment.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt / Bill No</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {busy ? (
                <TableRow><TableCell colSpan={4}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No payments have been recorded against your account yet.
                  </TableCell>
                </TableRow>
              ) : (
                history.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">{payment.receipt}</TableCell>
                    <TableCell>{formatDate(payment.paidOn, '—')}</TableCell>
                    <TableCell className="text-right font-semibold">{rupees(payment.amount)}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
