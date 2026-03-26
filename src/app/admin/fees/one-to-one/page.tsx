
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useBranchData } from "@/hooks/use-branch-data";
import { mockFeeRecords, FeeRecord } from "@/data/feesData";
import { IndianRupee, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const OneToOneFeesPage = () => {
  const { data: allFeeRecords } = useBranchData<FeeRecord>(mockFeeRecords);

  const oneToOneFeeRecords = useMemo(() => 
    allFeeRecords.filter(r => r.feeType === 'OneToOne')
  , [allFeeRecords]);

  const [filters, setFilters] = useState({ subject1: '', subject2: '' });
  const [filteredRecords, setFilteredRecords] = useState<FeeRecord[]>(oneToOneFeeRecords);

  const summary = useMemo(() => {
    const totalBilled = filteredRecords.reduce((sum, record) => sum + record.totalFee, 0);
    const totalCollected = filteredRecords.reduce((sum, record) => sum + record.collected, 0);
    const totalOutstanding = filteredRecords.reduce((sum, record) => sum + record.balance, 0);
    return { totalBilled, totalCollected, totalOutstanding };
  }, [filteredRecords]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    let records = oneToOneFeeRecords;
    const subject1 = filters.subject1.trim().toLowerCase();
    const subject2 = filters.subject2.trim().toLowerCase();

    if (subject1) {
      records = records.filter(r => r.subjects?.some(s => s.toLowerCase().includes(subject1)));
    }
    if (subject2) {
      records = records.filter(r => r.subjects?.some(s => s.toLowerCase().includes(subject2)));
    }
    setFilteredRecords(records);
  };

  const today = new Date();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters for One-to-One Fees</CardTitle>
          <CardDescription>Filter by one or two subjects to find specific records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              placeholder="Subject 1" 
              value={filters.subject1} 
              onChange={e => handleFilterChange('subject1', e.target.value)} 
            />
            <Input 
              placeholder="Subject 2 (optional)" 
              value={filters.subject2} 
              onChange={e => handleFilterChange('subject2', e.target.value)} 
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>One-to-One Fee Records</CardTitle>
          <CardDescription>
            Showing fee records for students enrolled in one-to-one coaching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Bill No</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => {
                const isOverdue = record.nextPaymentDate && new Date(record.nextPaymentDate) < today && record.balance > 0;
                return (
                  <TableRow key={record.id} className={cn(isOverdue && 'bg-amber-50')}>
                    <TableCell className={cn('font-medium', isOverdue && 'border-l-4 border-red-500')}>{record.studentName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(record.subjects || []).map(sub => <Badge key={sub} variant="secondary">{sub}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>1-1-{record.billNo}</TableCell>
                    <TableCell className="font-bold text-red-600">{record.balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                    <TableCell>{record.nextPaymentDate ? new Date(record.nextPaymentDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="space-x-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/fees/collect?studentId=${record.studentId}`}>Collect</Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-1" /> Remind
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRecords.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No records found matching your criteria.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OneToOneFeesPage;
