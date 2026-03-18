
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Pencil, 
  Trash2, 
  BookOpen,
  Filter,
  Check
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { mockClasses, mockSubjects, Subject } from "@/data/academicsData";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function SubjectManagementPage() {
  useAuth();
  const { currentBranch } = useBranch();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Filter subjects by branch and search term
  const filteredSubjects = useMemo(() => {
    return mockSubjects.filter(sub => 
      sub.branchId === currentBranch &&
      (sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       sub.board.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [currentBranch, searchTerm]);

  // Get class name from ID
  const getClassName = (id: string) => {
    return mockClasses.find(c => c.id === id)?.name || id;
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: editingSubject ? "Subject Updated" : "Subject Added",
      description: `Successfully ${editingSubject ? 'updated' : 'added'} the subject.`,
    });
    setIsAddModalOpen(false);
    setEditingSubject(null);
  };

  const handleDeleteSubject = (id: string) => {
    toast({
      title: "Subject Deleted",
      description: "The subject has been removed from the curriculum.",
      variant: "destructive"
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Subject Management" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/academics/classes" className="hover:text-[#0D7C8F]">Academics</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Subjects</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Subjects</h2>
            
            <Dialog open={isAddModalOpen} onOpenChange={(open) => {
              setIsAddModalOpen(open);
              if (!open) setEditingSubject(null);
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
                  <Plus className="h-4 w-4" /> Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSaveSubject}>
                  <DialogHeader>
                    <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
                    <DialogDescription>
                      Assign subjects to specific classes and boards.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Subject Name *</Label>
                      <Input id="name" placeholder="e.g. Advanced Mathematics" defaultValue={editingSubject?.name} required />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Linked Classes *</Label>
                      <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-slate-50 max-h-[150px] overflow-y-auto">
                        {mockClasses.filter(c => c.branchId === currentBranch).map(cls => (
                          <div key={cls.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`class-${cls.id}`} 
                              defaultChecked={editingSubject?.classIds.includes(cls.id)}
                            />
                            <Label htmlFor={`class-${cls.id}`} className="text-xs cursor-pointer">{cls.name} ({cls.board})</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="board">Board *</Label>
                        <Select defaultValue={editingSubject?.board || "CBSE"}>
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
                        <Label>Subject Type</Label>
                        <RadioGroup defaultValue={editingSubject?.type || "Theory"} className="flex gap-4 pt-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Theory" id="theory" />
                            <Label htmlFor="theory" className="cursor-pointer">Theory</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Practical" id="practical" />
                            <Label htmlFor="practical" className="cursor-pointer">Practical</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-[#0D7C8F] w-full sm:w-auto">
                      {editingSubject ? 'Update Subject' : 'Create Subject'}
                    </Button>
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
                  placeholder="Search subjects..." 
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

        {/* Subjects Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Linked Classes</TableHead>
                <TableHead>Board</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-[#1E2A4A]">{sub.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {sub.classIds.map(cid => (
                          <Badge key={cid} variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                            {getClassName(cid)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">{sub.board}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "font-semibold",
                        sub.type === 'Theory' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                      )}>
                        {sub.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                          onClick={() => {
                            setEditingSubject(sub);
                            setIsAddModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteSubject(sub.id)}
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
                      <BookOpen className="h-8 w-8 opacity-20" />
                      <p>No subjects found for this branch.</p>
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

