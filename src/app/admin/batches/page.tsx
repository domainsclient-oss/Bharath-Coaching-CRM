'use client';

import { useState, useEffect } from 'react';
import { batchService } from '../../../services/firestoreService';
import { useBranchData } from '../../../context/BranchContext';
import type { Batch } from '../../../models/batch';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { branchId } = useBranchData();

  useEffect(() => {
    if (!branchId) return;
    const fetchBatches = async () => {
      try {
        setLoading(true);
        setError(null);
        const batchList = await batchService.query([{ field: 'branchId', operator: '==', value: branchId }], { field: 'createdAt', direction: 'desc' });
        setBatches(batchList as Batch[]);
      } catch (err) {
        console.error('Failed to load batches:', err);
        setError('Failed to load batch data.');
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, [branchId]);

  const handleAddBatch = async () => {
    // In a real app, you'd use a form/modal to get batch details.
    const newBatchData: Omit<Batch, 'id'> = {
      branchId,
      name: `New Batch - ${new Date().getFullYear()}`,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    };
    try {
      const newBatch = await batchService.add(newBatchData);
      setBatches(prev => [newBatch as Batch, ...prev]);
      toast({ title: 'Success', description: 'Batch created.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Could not create batch.' });
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    try {
      await batchService.delete(id);
      setBatches(prev => prev.filter(b => b.id !== id));
      toast({ title: 'Success', description: 'Batch deleted.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Could not delete batch.' });
    }
  };
  
  const formatDate = (date: any) => new Date(date.seconds * 1000).toLocaleDateString();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Batch Management</h1>
        <Button onClick={handleAddBatch}><PlusCircle className="mr-2 h-4 w-4" /> Create Batch</Button>
      </div>
      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}
      <Card>
        <CardHeader><CardTitle>All Batches</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : (
                batches.map(batch => (
                  <TableRow key={batch.id}>
                    <TableCell>{batch.name}</TableCell>
                    <TableCell>{formatDate(batch.startDate)}</TableCell>
                    <TableCell>{formatDate(batch.endDate)}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteBatch(batch.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!loading && batches.length === 0 && <p className="text-center p-4">No batches found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
