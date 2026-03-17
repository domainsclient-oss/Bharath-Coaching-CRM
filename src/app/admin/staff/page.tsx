'use client';

import { useState, useEffect } from 'react';
import { staffService } from '../../../services/firestoreService';
import { useBranchData } from '../../../context/BranchContext'; // To filter by branch
import type { Staff } from '../../../models/staff'; // Assuming a Staff type definition exists
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

// Placeholder for a Staff Form component
// import { StaffForm } from './_components/StaffForm';

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [isFormOpen, setIsFormOpen] = useState(false);
  // const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const { branchId } = useBranchData(); // Get current branchId

  useEffect(() => {
    if (!branchId) return;

    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError(null);
        const staffList = await staffService.query([
          { field: 'branchId', operator: '==', value: branchId }
        ]);
        setStaff(staffList as Staff[]);
      } catch (err) {
        console.error("Failed to load staff:", err);
        setError("Failed to load staff data. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [branchId]);

  const handleAddStaff = async (formData: Omit<Staff, 'id'>) => {
    try {
      const newStaff = await staffService.add({ ...formData, branchId });
      setStaff(prev => [...prev, newStaff as Staff]);
      toast({ title: "Success", description: "Staff member added." });
      // setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to add staff:", err);
      toast({ title: "Error", description: "Could not add staff member.", variant: "destructive" });
    }
  };

  const handleUpdateStaff = async (id: string, formData: Partial<Staff>) => {
    try {
      await staffService.update(id, formData);
      setStaff(prev => prev.map(s => s.id === id ? { ...s, ...formData } : s));
      toast({ title: "Success", description: "Staff member updated." });
      // setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to update staff:", err);
      toast({ title: "Error", description: "Could not update staff member.", variant: "destructive" });
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await staffService.delete(id);
      setStaff(prev => prev.filter(s => s.id !== id));
      toast({ title: "Success", description: "Staff member deleted." });
    } catch (err) {
      console.error("Failed to delete staff:", err);
      toast({ title: "Error", description: "Could not delete staff member.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Staff Management</h1>
        <Button onClick={() => alert('Open form to add staff') /* setIsFormOpen(true); setSelectedStaff(null); */ }>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Staff
        </Button>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md mb-4">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>All Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))
            ) : (
              staff.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">{member.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={() => alert(`Editing ${member.name}`) /* setSelectedStaff(member); setIsFormOpen(true); */}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteStaff(member.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            {!loading && staff.length === 0 && <p>No staff members found for this branch.</p>}
          </div>
        </CardContent>
      </Card>
      
      {/* Placeholder for Staff Form Modal */}
      {/* {isFormOpen && <StaffForm staff={selectedStaff} onSave={selectedStaff ? (data) => handleUpdateStaff(selectedStaff.id, data) : handleAddStaff} onCancel={() => setIsFormOpen(false)} />} */}
    </div>
  );
}

// I've added a placeholder Staff type. In a real scenario, this would be in a model file.
// I'll create this in `src/models/staff.ts` next.
export type Staff = {
  id: string;
  name: string;
  role: 'teacher' | 'admin' | 'super_admin';
  branchId: string;
  email: string;
  phone: string;
};
