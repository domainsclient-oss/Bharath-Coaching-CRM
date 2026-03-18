
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Pencil, 
  Trash2, 
  Users,
  LayoutGrid,
  Filter
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { mockClasses, Class } from "@/data/academicsData";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { toast } from "@/hooks/use-toast";

export default function ClassManagementPage() {
  useAuth();
  const { currentBranch } = useBranch();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  // Filter classes by branch and search term
  const filteredClasses = useMemo(() => {
    return mockClasses.filter(cls => 
      cls.branchId === currentBranch &&
      (cls.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       cls.board.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [currentBranch, searchTerm]);

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save
    toast({
      title: editingClass ? "Class Updated" : "Class Added",
      description: `Successfully ${editingClass ? 'updated' : 'added'} the class.`,
    });
    setIsAddModalOpen(false);
    setEditingClass(null);
  };

  const handleDeleteClass = (id: string) => {
    toast({
      title: "Class Deleted",
      description: "The class has been removed from the system.",
      variant: "destructive"
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Class Management" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/academics" className="hover:text-[#0D7C8F]">Academics</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Classes</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Classes</h2>
            
            <Dialog open={isAddModalOpen} onOpenChange={(open) => {
              setIsAddModalOpen(open);
              if (!open) setEditingClass(null);
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
                  <Plus className="h-4 w-4" /> Add Class
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSaveClass}>
                  <DialogHeader>
                    <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
                    <DialogDescription>
                      Define a class for the current academic session.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Class Name *</Label>
                      <Input id="name" placeholder="e.g. Class 10" defaultValue={editingClass?.name} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="board">Board *</Label>
                      <Select defaultValue={editingClass?.board || "CBSE"}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Board" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CBSE">CBSE</SelectItem>
                          <SelectItem value="ICSE">ICSE</SelectItem>
                          <SelectItem value="State">State Board</SelectItem>
                          <SelectItem value="IB">IB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Study Mode</Label>
                      <RadioGroup defaultValue={editingClass?.mode || "Offline"} className="flex gap-4 pt-1">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Offline" id="offline" />
                          <Label htmlFor="offline" className="cursor-pointer">Offline</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Online" id="online" />
                          <Label htmlFor="online" className="cursor-pointer">Online</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Both" id="both" />
                          <Label htmlFor="both" className="cursor-pointer">Both</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-[#0D7C8F]">{editingClass ? 'Update Class' : 'Create Class'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by class name or board..." 
                  className="pl-10 h-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2 h-10">
                <Filter className="h-4 w-4" /> Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Class Grid / Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Board</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Total Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                  <TableRow key={cls.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-[#1E2A4A]">{cls.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">{cls.board}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        cls.mode === 'Offline' ? 'bg-[#1E2A4A]' : 
                        cls.mode === 'Online' ? 'bg-[#0D7C8F]' : 
                        'bg-teal-600'
                      }>
                        {cls.mode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{cls.studentCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                          onClick={() => {
                            setEditingClass(cls);
                            setIsAddModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteClass(cls.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LayoutGrid className="h-8 w-8 opacity-20" />
                      <p>No classes found for {currentBranch} branch.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
