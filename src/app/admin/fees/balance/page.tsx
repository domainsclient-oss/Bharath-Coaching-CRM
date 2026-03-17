
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranchData } from "@/hooks/use-branch-data";
import { mockFeeRecords, FeeRecord } from "@/data/feesData";
import { IndianRupee, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const BalanceDuesPage = () => {
  const { data: allFeeRecords } = useBranchData<FeeRecord>(mockFeeRecords);

  const balanceRecords = useMemo(() => allFeeRecords.filter(r => r.balance > 0), [allFeeRecords]);

  const [filters, setFilters] = useState({ name: '', class: '', board: '', subject: '' });
  const [filteredRecords, setFilteredRecords] = useState<FeeRecord[]>(balanceRecords);

  const summary = useMemo(() => {
    const totalOutstanding = filteredRecords.reduce((sum, record) => sum + record.balance, 0);
    const studentsWithDues = new Set(filteredRecords.map(r => r.studentId)).size;
    return { totalOutstanding, studentsWithDues };
  }, [filteredRecords]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    let records = balanceRecords;
    if (filters.name) {
      records = records.filter(r => r.studentName.toLowerCase().includes(filters.name.toLowerCase()));
    }
    if (filters.class) {
      records = records.filter(r => r.class === filters.class);
    }
    if (filters.board) {
      records = records.filter(r => r.board === filters.board);
    }
    if (filters.subject) {
      records = records.filter(r => r.subjects.includes(filters.subject));
    }
    setFilteredRecords(records);
  };

  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Outstanding Balance</CardTitle>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{summary.totalOutstanding.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students with Dues</CardTitle>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{summary.studentsWithDues}</div>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter students with balance dues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Input placeholder="Student Name" value={filters.name} onChange={e => handleFilterChange('name', e.target.value)} />
                <Input placeholder="Class" value={filters.class} onChange={e => handleFilterChange('class', e.target.value)} />
                <Input placeholder="Board" value={filters.board} onChange={e => handleFilterChange('board', e.target.value)} />
                <Input placeholder="Subject" value={filters.subject} onChange={e => handleFilterChange('subject', e.target.value)} />
                <Button onClick={handleSearch}>Search</Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Balance Dues</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Bill No</TableHead>
                <TableHead>Total Fee</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => {
                const isOverdue = record.nextPaymentDate && new Date(record.nextPaymentDate) < today;
                return (
                  <TableRow key={record.id} className={cn(isOverdue && 'bg-amber-50')}>
                    <TableCell className={cn('font-medium', isOverdue && 'border-l-4 border-red-500')}>{record.studentName}</TableCell>
                    <TableCell>{record.class}</TableCell>
                    <TableCell>{record.billNo}</TableCell>
                    <TableCell>{record.totalFee.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceDuesPage;
