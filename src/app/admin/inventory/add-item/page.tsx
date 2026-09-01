"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, PlusCircle, Search, Edit, Trash2,
  Package, AlertTriangle, Box, Layers,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ITEM_CATEGORIES, CATEGORY_COLORS } from "@/data/inventoryData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  totalStock: number;
  issuedStock: number;
  availableStock: number;
  minStockLevel: number;
  lastRestockedDate?: string;
  branchId: string;
}

const UNITS = ["Nos", "Reams", "Box", "Set", "Kg", "Litres", "Packets", "Pairs", "Rolls"];

const EMPTY = { name: "", category: "Stationery", unit: "Nos", totalStock: 0, availableStock: 0, minStockLevel: 5 };

export default function AddItemPage() {
  const { currentBranch } = useBranch();

  const { data: items, loading } = useFirestoreCollection<InventoryItem>("inventoryItems", currentBranch);

  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("All");
  const [isOpen,     setIsOpen]     = useState(false);
  const [editing,    setEditing]    = useState<InventoryItem | null>(null);
  const [form,       setForm]       = useState(EMPTY);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const kpi = useMemo(() => ({
    total:      items.length,
    lowStock:   items.filter(i => (i.availableStock ?? 0) <= (i.minStockLevel ?? 0)).length,
    outOfStock: items.filter(i => (i.availableStock ?? 0) === 0).length,
    categories: new Set(items.map(i => i.category)).size,
  }), [items]);

  const filtered = useMemo(() =>
    items.filter(i =>
      (catFilter === "All" || i.category === catFilter) &&
      i.name.toLowerCase().includes(search.toLowerCase())
    ), [items, search, catFilter]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setIsOpen(true); };
  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name:           item.name,
      category:       item.category,
      unit:           item.unit,
      totalStock:     item.totalStock     ?? 0,
      availableStock: item.availableStock ?? 0,
      minStockLevel:  item.minStockLevel  ?? 5,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Item name is required.", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      if (editing) {
        const issuedStock = editing.issuedStock ?? 0;
        const available   = Math.max(0, form.totalStock - issuedStock);
        await updateDocument("inventoryItems", editing.id, {
          name:           form.name.trim(),
          category:       form.category,
          unit:           form.unit,
          totalStock:     form.totalStock,
          availableStock: available,
          minStockLevel:  form.minStockLevel,
        });
        toast({ title: "Item Updated", description: `"${form.name}" updated.` });
      } else {
        const available = Math.max(0, form.totalStock - 0); // issuedStock = 0 for new items
        await addDocument("inventoryItems", {
          name:              form.name.trim(),
          category:          form.category,
          unit:              form.unit,
          totalStock:        form.totalStock,
          issuedStock:       0,
          availableStock:    available,
          minStockLevel:     form.minStockLevel,
          lastRestockedDate: new Date().toISOString().split("T")[0],
          branchId:          currentBranch,
        });
        toast({ title: "Item Created", description: `"${form.name}" added to inventory.` });
      }
      setIsOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to save item.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deleteDocument("inventoryItems", deletingId);
      toast({ title: "Item Removed", variant: "destructive" });
      setDeletingId(null);
    } catch {
      toast({ title: "Error", description: "Failed to remove item.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const f = (k: keyof typeof form, v: string | number) =>
    setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Add Item" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/inventory/store" className="hover:text-[#0D7C8F]">Stock Management</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Add Item</span>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Items",  value: kpi.total,      icon: Package,       color: "text-[#1E2A4A]", bg: "bg-blue-100"   },
            { label: "Categories",   value: kpi.categories, icon: Layers,        color: "text-purple-600",bg: "bg-purple-100" },
            { label: "Low Stock",    value: kpi.lowStock,   icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100"  },
            { label: "Out of Stock", value: kpi.outOfStock, icon: Box,           color: "text-red-500",   bg: "bg-red-100"    },
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

        {/* Filters + Add */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search items..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {ITEM_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={openAdd}>
                <PlusCircle className="h-4 w-4" /> Add Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-3 px-6">
            <CardTitle className="text-base font-bold text-[#1E2A4A]">
              {loading ? "Loading…" : `Inventory Items — ${filtered.length}`}
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-8 text-center">#</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-20 text-center">Unit</TableHead>
                <TableHead className="w-24 text-center">Total</TableHead>
                <TableHead className="w-24 text-center">Available</TableHead>
                <TableHead className="w-28 text-center">Min Level</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 opacity-20" />
                      <p>No items found{search || catFilter !== "All" ? " matching your filters" : `. Click "Add Item" to create one.`}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((item, idx) => {
                const available = item.availableStock ?? 0;
                const isLow     = available <= (item.minStockLevel ?? 0);
                return (
                  <TableRow key={item.id} className={`hover:bg-slate-50/50 ${isLow ? "bg-amber-50/20" : ""}`}>
                    <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1E2A4A]">{item.name}</span>
                        {available === 0
                          ? <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0 hover:bg-red-100">Out of Stock</Badge>
                          : isLow
                          ? <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 hover:bg-amber-100">
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Low Stock
                            </Badge>
                          : null
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] ?? "bg-slate-100 text-slate-700"}`}>
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">{item.unit}</TableCell>
                    <TableCell className="text-center font-medium">{item.totalStock ?? 0}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold text-sm ${available === 0 ? "text-red-500" : isLow ? "text-amber-600" : "text-green-600"}`}>
                        {available}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">{item.minStockLevel}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:bg-amber-50 hover:text-amber-700" onClick={() => openEdit(item)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setDeletingId(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </main>

      {/* Add / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={v => { if (!v) setIsOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">{editing ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Item Name *</Label>
              <Input placeholder="e.g. A4 Paper Reams" value={form.name} onChange={e => f("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Category *</Label>
                <Select value={form.category} onValueChange={v => f("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Unit</Label>
                <Select value={form.unit} onValueChange={v => f("unit", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Total Stock *</Label>
                <Input
                  type="number" min={0}
                  placeholder="e.g. 100"
                  value={form.totalStock}
                  onChange={e => f("totalStock", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Available Stock</Label>
                <Input
                  type="number" min={0}
                  value={editing
                    ? Math.max(0, form.totalStock - (editing.issuedStock ?? 0))
                    : form.totalStock}
                  readOnly
                  className="bg-slate-50 text-muted-foreground cursor-not-allowed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Auto = Total − Issued ({editing?.issuedStock ?? 0} issued)
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Minimum Stock Alert Level</Label>
              <Input type="number" min={0} value={form.minStockLevel} onChange={e => f("minStockLevel", Number(e.target.value))} />
              <p className="text-[11px] text-muted-foreground">Alert when stock falls at or below this level.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={v => { if (!v) setDeletingId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Remove Item</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to remove this item from inventory? This cannot be undone.</p>
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
