
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/lib/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { mockCenterSettings, mockBranches, mockUsers, CenterSettings, Branch, User } from '@/data/settingsData';
import { Save, PlusCircle, Edit, Trash2, Shield, AlertTriangle } from 'lucide-react';


const GeneralSettings = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: mockCenterSettings });
    const onSubmit = (data: any) => {
        console.log('Updated Settings:', data);
        alert('General settings updated!');
    };
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>App Name</Label><Input {...register("appName")}/></div>
                <div className="space-y-2"><Label>Contact Phone</Label><Input {...register("contactPhone")}/></div>
                 <div className="space-y-2"><Label>Contact Email</Label><Input type="email" {...register("contactEmail")}/></div>
                <div className="space-y-2"><Label>Currency</Label><Controller name="currency" control={undefined} render={({field}: any) => <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="INR">INR</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select>}/></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input {...register("address")}/></div>
             <Button type="submit"><Save className="mr-2 h-4 w-4"/> Save Changes</Button>
        </form>
    )
}

const BranchManagement = () => {
    const [branches, setBranches] = useState(mockBranches);
    // Add logic for Add/Edit/Delete branches
    return (
        <Table>
            <TableHeader><TableRow><TableHead>Branch Name</TableHead><TableHead>Address</TableHead><TableHead>Phone</TableHead><TableHead>Headmaster</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
                {branches.map(branch => (
                    <TableRow key={branch.id}>
                        <TableCell>{branch.name}</TableCell><TableCell>{branch.address}</TableCell><TableCell>{branch.phone}</TableCell><TableCell>{branch.headmaster}</TableCell>
                        <TableCell className="space-x-1"><Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

const UserManagement = () => {
    const [users, setUsers] = useState(mockUsers);
    // Add logic for Add/Edit/Delete users
    return (
        <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Branch</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
                {users.map(user => (
                    <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.role}</TableCell><TableCell>{user.branchId || 'N/A'}</TableCell><TableCell>{user.status}</TableCell>
                        <TableCell className="space-x-1"><Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

const SystemInfo = () => (
    <div className="space-y-2 text-sm text-muted-foreground">
        <p><strong>App Version:</strong> 1.0.0</p>
        <p><strong>Framework:</strong> Next.js 14</p>
        <p><strong>Database:</strong> Firebase Firestore</p>
        <p><strong>Last Checked:</strong> {new Date().toLocaleString()}</p>
    </div>
);


const SettingsPage = () => {
    const { user } = useAuth();

    if (user?.role !== 'super_admin') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                 <AlertTriangle className="w-24 h-24 text-destructive mb-4"/>
                <h1 className="text-4xl font-bold">403 - Forbidden</h1>
                <p className="text-lg text-muted-foreground mt-2">You do not have permission to access this page.</p>
                <p className="mt-4">This area is restricted to Super Administrators only.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">System Settings</h1>
            </div>

            <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="branches">Branches</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="info">System Info</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                    <Card><CardHeader><CardTitle>General Settings</CardTitle><CardDescription>Manage global application settings.</CardDescription></CardHeader><CardContent><GeneralSettings/></CardContent></Card>
                </TabsContent>
                 <TabsContent value="branches">
                    <Card><CardHeader><CardTitle>Branch Management</CardTitle><CardDescription>Add, edit, or remove academy branches.</CardDescription></CardHeader><CardContent><BranchManagement/></CardContent></Card>
                </TabsContent>
                 <TabsContent value="users">
                    <Card><CardHeader><CardTitle>User Management</CardTitle><CardDescription>Manage user accounts and roles.</CardDescription></CardHeader><CardContent><UserManagement/></CardContent></Card>
                </TabsContent>
                <TabsContent value="info">
                    <Card><CardHeader><CardTitle>System Information</CardTitle><CardDescription>View details about the application environment.</CardDescription></CardHeader><CardContent><SystemInfo/></CardContent></Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default SettingsPage; 
