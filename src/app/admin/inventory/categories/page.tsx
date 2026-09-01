"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, PlusCircle, Edit, Trash2, Tag, Layers, Package,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORY_COLORS } from "@/data/inventoryData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface CategoryDoc {
  id: string;
  name: string;
  description: string;
  branchId: string;
}

interface InventoryItem {
  id: string;
  category: string;
  branchId: string;
}

const EMPTY = { name: "", description: "" };

export default function ItemCategoriesPage() {
  const { currentBranch } = useBranch();

  const { data: categories, loading: catLoading   } = useFirestoreCollection<CategoryDoc>("inventoryCategories", currentBranch);
  const { data: items,      loading: itemsLoading  } = useFirestoreCollection<InventoryItem>("inventoryItems", currentBranch);

  const loading = catLoading || itemsLoading;

  const [isOpen,     setIsOpen]     = useState(false);
  const [editing,    setEditing]    = useState<CategoryDoc | null>(null);
  const [form,       setForm]       = useState(EMPTY);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  // Live item counts per category name from real inventoryItems
  const itemCounts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(i => { map[i.category] = (map[i.category] ?? 0) + 1; });
    return map;
  }, [items]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setIsOpen(true); };
  const openEdit = (cat: CategoryDoc) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Category name is required.", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDocument("inventoryCategories", editing.id, {
          name: form.name.trim(),
          description: form.description,
        });
        toast({ title: "Category Updated", description: `"${form.name}" updated.` });
      } else {
        await addDocument("inventoryCategories", {
          name:        form.name.trim(),
          description: form.description,
          branchId:    currentBranch,
        });
        toast({ title: "Category Added", description: `"${form.name}" added.` });
      }
      setIsOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to save category.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deleteDocument("inventoryCategories", deletingId);
      toast({ title: "Category Removed", variant: "destructive" });
      setDeletingId(null);
    } catch {
      toast({ title: "Error", description: "Failed to remove category.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const totalTagged = Object.values(itemCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Item Categories" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/inventory/store" className="hover:text-[#0D7C8F]">Stock Management</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Item Categories</span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Total Categories", value: categories.length, icon: Layers,  color: "text-[#1E2A4A]", bg: "bg-blue-100"   },
            { label: "Total Items",      value: items.length,      icon: Package, color: "text-teal-600",   bg: "bg-teal-100"   },
            { label: "Tagged Items",     value: totalTagged,        icon: Tag,     color: "text-purple-600", bg: "bg-purple-100" },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    {loading
                      ? <Skeleton className="h-7 w-10 mt-1" />
                      : <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Header + Add button */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1E2A4A]">All Categories</h2>
          <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={openAdd}>
            <PlusCircle className="h-4 w-4" /> Add Category
          </Button>
        </div>

        {/* Category cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : categories.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="p-10 text-center text-muted-foreground">
              <Layers className="h-10 w-10 opacity-20 mx-auto mb-3" />
              <p className="text-sm">No categories yet. Click &quot;Add Category&quot; to create one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => {
              const liveCount  = itemCounts[cat.name] ?? 0;
              const colorClass = CATEGORY_COLORS[cat.name as keyof typeof CATEGORY_COLORS] ?? "bg-slate-100 text-slate-700";
              return (
                <Card key={cat.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                          <Tag className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#1E2A4A] text-sm">{cat.name}</h3>
                          <Badge variant="outline" className="text-[10px] mt-0.5">{liveCount} item{liveCount !== 1 ? "s" : ""}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:bg-amber-50 hover:text-amber-700" onClick={() => openEdit(cat)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setDeletingId(cat.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{cat.description || "No description provided."}</p>
                    <div className="mt-3">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colorClass.split(" ")[0]}`}
                          style={{ width: `${Math.min(100, liveCount * 10)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Table view */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-3 px-6">
            <CardTitle className="text-base font-bold text-[#1E2A4A]">Category Summary</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-8 text-center">#</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-28 text-center">Items</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground text-sm">
                    No categories added yet.
                  </TableCell>
                </TableRow>
              ) : categories.map((cat, idx) => (
                <TableRow key={cat.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${CATEGORY_COLORS[cat.name as keyof typeof CATEGORY_COLORS] ?? "bg-slate-100 text-slate-700"}`}>
                      {cat.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{cat.description || "—"}</TableCell>
                  <TableCell className="text-center font-semibold">{itemCounts[cat.name] ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:bg-amber-50 hover:text-amber-700" onClick={() => openEdit(cat)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setDeletingId(cat.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>

      {/* Add / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={v => { if (!v) setIsOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">{editing ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category Name *</Label>
              <Input placeholder="e.g. Lab Equipment" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea placeholder="Brief description of items in this category..." rows={3}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={v => { if (!v) setDeletingId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Remove Category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? Existing items in this category will keep their current tag.</p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete} disabled={deleting}>
              {deleting ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
