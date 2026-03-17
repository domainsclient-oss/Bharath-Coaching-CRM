'use client';

import { useState, useEffect } from 'react';
import { expenseService } from '../../../services/firestoreService';
import { useBranchData } from '../../../context/BranchContext';
import type { Expense } from '../../../models/expense';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

// Assume an ExpenseForm component exists for the modal
// import { ExpenseForm } from './_components/ExpenseForm';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { branchId } = useBranchData();
  // Add state for filters if needed, e.g., date range

  useEffect(() => {
    if (!branchId) return;

    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError(null);
        const expenseList = await expenseService.query(
          [{ field: 'branchId', operator: '==', value: branchId }],
          { field: 'date', direction: 'desc' }
        );
        setExpenses(expenseList as Expense[]);
      } catch (err) {
        console.error("Failed to load expenses:", err);
        setError("Failed to load expense data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [branchId]);

  const handleAddExpense = async (formData: Omit<Expense, 'id'>) => {
    try {
      const newExpense = await expenseService.add({ ...formData, branchId });
      setExpenses(prev => [newExpense as Expense, ...prev]);
      toast({ title: "Success", description: "Expense added." });
    } catch (err) {
      console.error("Error adding expense:", err);
      toast({ title: "Error", description: "Could not add expense.", variant: "destructive" });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await expenseService.delete(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast({ title: "Success", description: "Expense deleted." });
    } catch (err) {
      console.error("Error deleting expense:", err);
      toast({ title: "Error", description: "Could not delete expense.", variant: "destructive" });
    }
  };

  const formatDate = (date: any) => new Date(date.seconds * 1000).toLocaleDateString();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Expense Management</h1>
        <Button onClick={() => alert('Open form to add expense')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

      <Card>
        <CardHeader><CardTitle>All Expenses</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : (
                expenses.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>₹{expense.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!loading && expenses.length === 0 && <p className="text-center p-4">No expenses found for this branch.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
