"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBranchData } from "@/hooks/use-branch-data";
import { mockStaff, Staff } from "@/data/hrData";
import { PlusCircle, List, LayoutGrid, Phone, Mail, UserPlus, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

const StaffDirectoryPage = () => {
  const router = useRouter();
  const { data: staff } = useBranchData<Staff>(mockStaff);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [filters, setFilters] = useState({ role: 'all', status: 'all', search: '' });

  const filteredStaff = useMemo(() => {
    return staff.filter(s => 
      (filters.role !== 'all' ? s.role === filters.role : true) &&
      (filters.status !== 'all' ? s.status === filters.status : true) &&
      (filters.search ? s.name.toLowerCase().includes(filters.search.toLowerCase()) || s.staffId.toLowerCase().includes(filters.search.toLowerCase()) : true)
    );
  }, [staff, filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const roleColors: { [key: string]: string } = {
    Principal: 'bg-purple-500',
    Admin: 'bg-blue-500',
    Teacher: 'bg-teal-500',
    Support: 'bg-orange-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Staff Directory</h1>
        <div className="flex items-center space-x-2">
            <Link href="/admin/hr/staff/new">
                <Button><UserPlus className="mr-2 h-4 w-4"/> Add Staff</Button>
            </Link>
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <Input 
                placeholder="Search by name or staff ID..." 
                value={filters.search} 
                onChange={e => handleFilterChange('search', e.target.value)} 
                className="max-w-sm"
            />
            <div className="flex items-center gap-4">
                <Select value={filters.role} onValueChange={v => handleFilterChange('role', v)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Principal">Principal</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={filters.status} onValueChange={v => handleFilterChange('status', v)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex items-center bg-muted p-1 rounded-md">
                    <Button variant={viewMode === 'card' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('card')}><LayoutGrid className="h-5 w-5"/></Button>
                    <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('table')}><List className="h-5 w-5"/></Button>
                </div>
            </div>
        </CardContent>
      </Card>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredStaff.map(s => (
            <Card key={s.id} className="overflow-hidden text-center group">
              <div className={`h-20 ${roleColors[s.role] || 'bg-gray-500'} relative`}>
                 <Badge className="absolute top-2 right-2" variant={s.status === 'Active' ? 'default' : 'destructive'}>{s.status}</Badge>
              </div>
              <CardContent className="p-6 relative">
                 <Avatar className="w-24 h-24 absolute left-1/2 -translate-x-1/2 -top-12 border-4 border-background">
                    <AvatarImage src={s.photo} alt={s.name} />
                    <AvatarFallback className={`text-2xl ${roleColors[s.role] || 'bg-gray-500'} text-white`}>{getInitials(s.name)}</AvatarFallback>
                </Avatar>
                <div className="mt-12">
                  <CardTitle>{s.name}</CardTitle>
                  <CardDescription>{s.staffId} | {s.role}</CardDescription>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-1">
                    {(s.subjects || []).slice(0, 2).map(sub => <Badge key={sub} variant="secondary">{sub}</Badge>)}
                    {(s.subjects || []).length > 2 && <Badge variant="outline">+{(s.subjects || []).length-2} more</Badge>}
                </div>
                <div className="mt-4 flex justify-center items-center space-x-4 text-muted-foreground">
                    <a href={`tel:${s.phone}`}><Phone className="h-5 w-5 hover:text-primary"/></a>
                    <a href={`mailto:${s.email}`}><Mail className="h-5 w-5 hover:text-primary"/></a>
                </div>
                 <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="space-x-2">
                         <Link href={`/admin/hr/staff/${s.id}`} passHref><Button variant="outline" size="icon"><Eye/></Button></Link>
                        <Link href={`/admin/hr/staff/${s.id}?edit=true`} passHref><Button variant="outline" size="icon"><Edit/></Button></Link>
                        <Button variant="destructive" size="icon"><Trash2/></Button>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Staff ID</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Subjects</TableHead><TableHead>Phone</TableHead><TableHead>Join Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                    {filteredStaff.map(s => (
                        <TableRow key={s.id}>
                            <TableCell>{s.staffId}</TableCell>
                            <TableCell className="font-medium flex items-center"><Avatar className="w-8 h-8 mr-2"><AvatarImage src={s.photo} alt={s.name} /><AvatarFallback>{getInitials(s.name)}</AvatarFallback></Avatar>{s.name}</TableCell>
                            <TableCell><Badge className={`${roleColors[s.role] || 'bg-gray-500'} hover:${roleColors[s.role] || 'bg-gray-500'}`}>{s.role}</Badge></TableCell>
                            <TableCell>{(s.subjects || []).join(', ')}</TableCell>
                            <TableCell>{s.phone}</TableCell>
                            <TableCell>{s.joinDate ? new Date(s.joinDate).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell><Badge variant={s.status === 'Active' ? 'default' : 'destructive'}>{s.status}</Badge></TableCell>
                            <TableCell className="space-x-1">
                               <Link href={`/admin/hr/staff/${s.id}`} passHref><Button variant="ghost" size="icon"><Eye className="h-4 w-4"/></Button></Link>
                               <Link href={`/admin/hr/staff/${s.id}?edit=true`} passHref><Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button></Link>
                               <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {filteredStaff.length === 0 && <p className="text-center text-muted-foreground mt-6">No staff members found matching your criteria.</p>}
    </div>
  );
};

export default StaffDirectoryPage;