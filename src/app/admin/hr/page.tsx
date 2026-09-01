"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { List, LayoutGrid, Phone, Mail, UserPlus, Eye, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { SharedHeader } from "@/components/layout/shared-header";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Staff {
  id: string;
  staffId?: string;
  name: string;
  role: string;
  status: string;
  phone?: string;
  email?: string;
  photo?: string;
  subjects?: string[];
  joinDate?: string;
  branchId: string;
}

const roleColors: Record<string, string> = {
  Principal: "bg-purple-500",
  Admin:     "bg-blue-500",
  Teacher:   "bg-teal-500",
  Support:   "bg-orange-500",
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const StaffDirectoryPage = () => {
  const router = useRouter();
  const { currentBranch } = useBranch();
  const { data: staff, loading } = useFirestoreCollection<Staff>("staff", currentBranch);

  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [filters, setFilters] = useState({ role: "all", status: "all", search: "" });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const filteredStaff = useMemo(() =>
    staff.filter((s) =>
      (filters.role   !== "all" ? s.role   === filters.role   : true) &&
      (filters.status !== "all" ? s.status === filters.status : true) &&
      (filters.search
        ? s.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          (s.staffId ?? "").toLowerCase().includes(filters.search.toLowerCase())
        : true)
    ), [staff, filters]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument("staff", deleteTarget.id);
      toast({ title: "Staff Removed", description: `${deleteTarget.name} has been deleted.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not delete staff member." });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="HR — Staff Directory" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1E2A4A]">Staff Directory</h1>
          <Link href="/admin/hr/staff/new">
            <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
              <UserPlus className="mr-2 h-4 w-4" /> Add Staff
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <Input
              placeholder="Search by name or staff ID..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="max-w-sm"
            />
            <div className="flex items-center gap-4">
              <Select value={filters.role} onValueChange={(v) => setFilters((f) => ({ ...f, role: v }))}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Principal">Principal</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center bg-muted p-1 rounded-md">
                <Button variant={viewMode === "card" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("card")}>
                  <LayoutGrid className="h-5 w-5" />
                </Button>
                <Button variant={viewMode === "table" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("table")}>
                  <List className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        )}

        {!loading && viewMode === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredStaff.map((s) => (
              <Card key={s.id} className="overflow-hidden text-center group">
                <div className={`h-20 ${roleColors[s.role] || "bg-gray-500"} relative`}>
                  <Badge className="absolute top-2 right-2" variant={s.status === "Active" ? "default" : "destructive"}>
                    {s.status}
                  </Badge>
                </div>
                <CardContent className="p-6 relative">
                  <Avatar className="w-24 h-24 absolute left-1/2 -translate-x-1/2 -top-12 border-4 border-background">
                    <AvatarImage src={s.photo} alt={s.name} />
                    <AvatarFallback className={`text-2xl ${roleColors[s.role] || "bg-gray-500"} text-white`}>
                      {getInitials(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-12">
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    <CardDescription>{s.staffId ?? s.id} | {s.role}</CardDescription>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-1">
                    {(s.subjects ?? []).slice(0, 2).map((sub) => (
                      <Badge key={sub} variant="secondary">{sub}</Badge>
                    ))}
                    {(s.subjects ?? []).length > 2 && (
                      <Badge variant="outline">+{(s.subjects ?? []).length - 2} more</Badge>
                    )}
                  </div>
                  <div className="mt-4 flex justify-center items-center space-x-4 text-muted-foreground">
                    {s.phone && <a href={`tel:${s.phone}`}><Phone className="h-5 w-5 hover:text-primary" /></a>}
                    {s.email && <a href={`mailto:${s.email}`}><Mail className="h-5 w-5 hover:text-primary" /></a>}
                  </div>
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="space-x-2">
                      <Link href={`/admin/hr/staff/${s.id}`}>
                        <Button variant="outline" size="icon"><Eye /></Button>
                      </Link>
                      <Link href={`/admin/hr/staff/${s.id}?edit=true`}>
                        <Button variant="outline" size="icon"><Edit /></Button>
                      </Link>
                      <Button variant="destructive" size="icon" onClick={() => setDeleteTarget({ id: s.id, name: s.name })}>
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !loading ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.staffId ?? s.id}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={s.photo} alt={s.name} />
                            <AvatarFallback className="text-xs">{getInitials(s.name)}</AvatarFallback>
                          </Avatar>
                          {s.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${roleColors[s.role] || "bg-gray-500"} text-white`}>{s.role}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{(s.subjects ?? []).join(", ") || "—"}</TableCell>
                      <TableCell>{s.phone ?? "—"}</TableCell>
                      <TableCell>{s.joinDate ? new Date(s.joinDate).toLocaleDateString("en-IN") : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === "Active" ? "default" : "destructive"}>{s.status}</Badge>
                      </TableCell>
                      <TableCell className="space-x-1">
                        <Link href={`/admin/hr/staff/${s.id}`}>
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Link href={`/admin/hr/staff/${s.id}?edit=true`}>
                          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        </Link>
                        <Button
                          variant="ghost" size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        {!loading && filteredStaff.length === 0 && (
          <p className="text-center text-muted-foreground mt-6">
            {staff.length === 0
              ? "No staff added yet. Click 'Add Staff' to get started."
              : "No staff members match your search."}
          </p>
        )}
      </main>

      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Remove Staff Member</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>? This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90" onClick={handleDelete}>Remove</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffDirectoryPage;
