"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Save, PlusCircle, Edit, Trash2, AlertTriangle, Building2, Users, Settings } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { db } from "@/config/firebase";
import { doc, setDoc, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { registerUser } from "@/services/authService";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CenterSettings {
  appName: string;
  contactEmail: string;
  contactPhone: string;
  currency: string;
  address: string;
}

interface BranchDoc {
  id: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  headmaster?: string;
  status: string;
}

interface UserDoc {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId?: string;
  status: string;
}

const ROLES = ["super_admin", "admin", "teacher", "student"];
const ROLE_COLOR: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  admin:       "bg-blue-100 text-blue-700",
  teacher:     "bg-teal-100 text-teal-700",
  student:     "bg-green-100 text-green-700",
};

// ─── General Settings ─────────────────────────────────────────────────────────

const GeneralSettings = () => {
  const { settings, loading } = useSettings();
  const [saving, setSaving]   = useState(false);

  const { register, handleSubmit, control, reset } = useForm<CenterSettings>({
    defaultValues: settings,
  });

  // When Firestore settings load, pre-fill the form
  useEffect(() => {
    if (!loading) reset(settings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const onSubmit = async (data: CenterSettings) => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "general"), { ...data, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Settings Saved", description: "General settings updated successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>App Name</Label><Input {...register("appName")} placeholder="Academy Name" /></div>
        <div className="space-y-2"><Label>Contact Phone</Label><Input {...register("contactPhone")} placeholder="+91 99999 99999" /></div>
        <div className="space-y-2"><Label>Contact Email</Label><Input type="email" {...register("contactEmail")} placeholder="info@academy.com" /></div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Controller name="currency" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR (₹)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
      </div>
      <div className="space-y-2"><Label>Address</Label><Input {...register("address")} placeholder="Full address" /></div>
      <Button type="submit" className="bg-[#1E2A4A] hover:bg-[#0D7C8F]" disabled={saving}>
        <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
};

// ─── Branch Management ────────────────────────────────────────────────────────

const BRANCH_EMPTY = { name: "", city: "", address: "", phone: "", headmaster: "", status: "active" };

const DEFAULT_BRANCHES = [
  { name: "Trichy",     city: "Trichy",     address: "Srirangam, Trichy",   status: "active" },
  { name: "Chennai",    city: "Chennai",    address: "Anna Nagar, Chennai",  status: "active" },
  { name: "Coimbatore", city: "Coimbatore", address: "RS Puram, Coimbatore", status: "active" },
  { name: "Madurai",    city: "Madurai",    address: "K.K. Nagar, Madurai",  status: "active" },
];

const BranchManagement = () => {
  const { data: branches, loading } = useFirestoreCollection<BranchDoc>("branches", null, { filterByBranch: false });

  // Seed default branches into Firestore if collection is empty
  useEffect(() => {
    if (!loading && branches.length === 0) {
      const batch = writeBatch(db);
      DEFAULT_BRANCHES.forEach(b => {
        batch.set(doc(db, "branches", b.name), { ...b, createdAt: serverTimestamp() });
      });
      batch.commit().catch(() => {});
    }
  }, [loading, branches.length]);

  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<BranchDoc | null>(null);
  const [form,    setForm]    = useState(BRANCH_EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [delId,   setDelId]   = useState<string | null>(null);

  const openAdd  = () => { setEditing(null); setForm(BRANCH_EMPTY); setOpen(true); };
  const openEdit = (b: BranchDoc) => { setEditing(b); setForm({ name: b.name, city: b.city, address: b.address ?? "", phone: b.phone ?? "", headmaster: b.headmaster ?? "", status: b.status }); setOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateDoc(doc(db, "branches", editing.id), { ...form, updatedAt: serverTimestamp() });
        toast({ title: "Branch Updated" });
      } else {
        // Use branch name as doc ID so it matches branchId stored on all other docs
        const branchId = form.name.trim();
        await setDoc(doc(db, "branches", branchId), { ...form, createdAt: serverTimestamp() }, { merge: true });
        toast({ title: "Branch Added", description: `"${branchId}" is now available in the branch switcher.` });
      }
      setOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to save branch.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!delId) return;
    try {
      await deleteDoc(doc(db, "branches", delId));
      toast({ title: "Branch Deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete branch.", variant: "destructive" });
    } finally {
      setDelId(null);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button size="sm" className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-1.5" onClick={openAdd}>
          <PlusCircle className="h-4 w-4" /> Add Branch
        </Button>
      </div>

      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Branch Name</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Headmaster</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            [...Array(4)].map((_, i) => (
              <TableRow key={i}>{[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            ))
          ) : branches.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="h-20 text-center text-muted-foreground">No branches added yet.</TableCell></TableRow>
          ) : branches.map(b => (
            <TableRow key={b.id} className="hover:bg-slate-50/50">
              <TableCell className="font-semibold text-sm text-[#1E2A4A]">{b.name}</TableCell>
              <TableCell className="text-sm">{b.city}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{b.phone || "—"}</TableCell>
              <TableCell className="text-sm">{b.headmaster || "—"}</TableCell>
              <TableCell>
                <Badge className={`text-[10px] ${b.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{b.status}</Badge>
              </TableCell>
              <TableCell className="space-x-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDelId(b.id)}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Branch" : "Add Branch"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { label: "Branch Name *", key: "name",       placeholder: "e.g. Trichy Branch" },
              { label: "City *",        key: "city",       placeholder: "e.g. Trichy" },
              { label: "Address",       key: "address",    placeholder: "Full address" },
              { label: "Phone",         key: "phone",      placeholder: "+91 99999 99999" },
              { label: "Headmaster",    key: "headmaster", placeholder: "Name" },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                <Input placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F]" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!delId} onOpenChange={() => setDelId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Branch?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── User Management ──────────────────────────────────────────────────────────

const USER_EMPTY = { name: "", email: "", password: "", role: "admin", branchId: "", status: "active" };

const UserManagement = () => {
  const { data: users, loading } = useFirestoreCollection<UserDoc>("users", null, { filterByBranch: false });

  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<UserDoc | null>(null);
  const [form,    setForm]    = useState(USER_EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [delId,   setDelId]   = useState<string | null>(null);

  const openAdd  = () => { setEditing(null); setForm(USER_EMPTY); setOpen(true); };
  const openEdit = (u: UserDoc) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, branchId: u.branchId ?? "", status: u.status });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateDoc(doc(db, "users", editing.id), {
          name: form.name, role: form.role, branchId: form.branchId, status: form.status, updatedAt: serverTimestamp(),
        });
        toast({ title: "User Updated" });
      } else {
        if (!form.password.trim()) { toast({ title: "Password required", variant: "destructive" }); setSaving(false); return; }
        await registerUser(form.email, form.password, { name: form.name, role: form.role, branchId: form.branchId || undefined, status: form.status } as any);
        toast({ title: "User Created", description: `${form.name} can now log in.` });
      }
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to save user.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!delId) return;
    try {
      await deleteDoc(doc(db, "users", delId));
      toast({ title: "User Removed", description: "Firestore record deleted. Firebase Auth account remains." });
    } catch {
      toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
    } finally {
      setDelId(null);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button size="sm" className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-1.5" onClick={openAdd}>
          <PlusCircle className="h-4 w-4" /> Add User
        </Button>
      </div>

      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            [...Array(4)].map((_, i) => (
              <TableRow key={i}>{[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
            ))
          ) : users.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="h-20 text-center text-muted-foreground">No users found.</TableCell></TableRow>
          ) : users.map(u => (
            <TableRow key={u.id} className="hover:bg-slate-50/50">
              <TableCell className="font-semibold text-sm text-[#1E2A4A]">{u.name}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
              <TableCell><Badge className={`text-[10px] ${ROLE_COLOR[u.role] ?? "bg-slate-100 text-slate-700"}`}>{u.role}</Badge></TableCell>
              <TableCell className="text-xs text-muted-foreground">{u.branchId || "All"}</TableCell>
              <TableCell>
                <Badge className={`text-[10px] ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{u.status}</Badge>
              </TableCell>
              <TableCell className="space-x-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDelId(u.id)}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label className="text-xs">Name *</Label><Input placeholder="Full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Email *</Label><Input type="email" placeholder="user@example.com" value={form.email} disabled={!!editing} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            {!editing && (
              <div className="space-y-1"><Label className="text-xs">Password *</Label><Input type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Branch ID</Label><Input placeholder="e.g. Trichy (leave blank for all)" value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F]" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!delId} onOpenChange={() => setDelId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remove User?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This removes the Firestore record. The Firebase Auth account will remain.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── System Info ──────────────────────────────────────────────────────────────

const SystemInfo = () => (
  <div className="space-y-3 text-sm">
    {[
      { label: "App Version",  value: "1.0.0" },
      { label: "Framework",    value: "Next.js 15 (App Router)" },
      { label: "Database",     value: "Firebase Firestore" },
      { label: "Auth",         value: "Firebase Authentication" },
      { label: "Last Checked", value: new Date().toLocaleString("en-IN") },
    ].map(r => (
      <div key={r.label} className="flex items-center gap-3 py-2 border-b last:border-0">
        <span className="text-muted-foreground w-32 flex-shrink-0">{r.label}</span>
        <span className="font-medium text-[#1E2A4A]">{r.value}</span>
      </div>
    ))}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth();

  if (user?.role !== "super_admin") {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
        <SharedHeader title="System Settings" />
        <main className="flex flex-col items-center justify-center flex-1 text-center p-8 gap-4">
          <AlertTriangle className="w-16 h-16 text-amber-400 opacity-60" />
          <h1 className="text-2xl font-bold text-[#1E2A4A]">Access Restricted</h1>
          <p className="text-muted-foreground">This page is only accessible to Super Administrators.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="System Settings" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="gap-1.5"><Settings className="h-4 w-4" /> General</TabsTrigger>
            <TabsTrigger value="branches" className="gap-1.5"><Building2 className="h-4 w-4" /> Branches</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5"><Users className="h-4 w-4" /> Users</TabsTrigger>
            <TabsTrigger value="info">System Info</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b py-3 px-6">
                <CardTitle className="text-sm font-bold text-[#1E2A4A]">General Settings</CardTitle>
                <CardDescription>Manage global application settings.</CardDescription>
              </CardHeader>
              <CardContent className="p-6"><GeneralSettings /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branches">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b py-3 px-6">
                <CardTitle className="text-sm font-bold text-[#1E2A4A]">Branch Management</CardTitle>
                <CardDescription>Add, edit, or remove academy branches.</CardDescription>
              </CardHeader>
              <CardContent className="p-6"><BranchManagement /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b py-3 px-6">
                <CardTitle className="text-sm font-bold text-[#1E2A4A]">User Management</CardTitle>
                <CardDescription>Manage user accounts and roles.</CardDescription>
              </CardHeader>
              <CardContent className="p-6"><UserManagement /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b py-3 px-6">
                <CardTitle className="text-sm font-bold text-[#1E2A4A]">System Information</CardTitle>
                <CardDescription>Application environment details.</CardDescription>
              </CardHeader>
              <CardContent className="p-6"><SystemInfo /></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
