"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Plus, Search, Package, AlertTriangle, TrendingUp,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ITEM_CATEGORIES, CATEGORY_COLORS } from "@/data/inventoryData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument } from "@/services/firestoreService";
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

interface StockEntry {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  purchaseDate: string;
  supplier?: string;
  costPerUnit?: number;
  invoiceNo?: string;
  addedBy: string;
  branchId: string;
}

const UNITS = ["Nos", "Reams", "Box", "Set", "Kg", "Litres", "Packets"];

const EMPTY_STOCK_FORM = {
  itemId: "", quantity: 1, purchaseDate: new Date().toISOString().split("T")[0],
  supplier: "", costPerUnit: 0, invoiceNo: "", addedBy: "Admin",
};

const EMPTY_ITEM_FORM = {
  name: "", category: "Stationery", unit: "Nos", minStockLevel: 5,
};

export default function AddItemStockPage() {
  const { currentBranch } = useBranch();

  const { data: items,        loading: itemsLoading   } = useFirestoreCollection<InventoryItem>("inventoryItems", currentBranch);
  const { data: stockEntries, loading: entriesLoading } = useFirestoreCollection<StockEntry>("stockEntries", currentBranch);

  const loading = itemsLoading || entriesLoading;

  const [search,         setSearch]         = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockForm,      setStockForm]      = useState(EMPTY_STOCK_FORM);
  const [itemForm,       setItemForm]       = useState(EMPTY_ITEM_FORM);
  const [isStockOpen,    setIsStockOpen]    = useState(false);
  const [isItemOpen,     setIsItemOpen]     = useState(false);
  const [savingStock,    setSavingStock]    = useState(false);
  const [savingItem,     setSavingItem]     = useState(false);

  const filteredItems = useMemo(() =>
    items.filter(i =>
      (categoryFilter === "All" || i.category === categoryFilter) &&
      i.name.toLowerCase().includes(search.toLowerCase())
    ),
    [items, categoryFilter, search]
  );

  const selectedItem = useMemo(() =>
    items.find(i => i.id === stockForm.itemId),
    [items, stockForm.itemId]
  );

  const lowStockItems = items.filter(i => (i.availableStock ?? 0) <= (i.minStockLevel ?? 0));

  const sortedEntries = useMemo(() =>
    [...stockEntries].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate)),
    [stockEntries]
  );

  const handleAddStock = async () => {
    if (!stockForm.itemId || stockForm.quantity < 1) {
      toast({ title: "Missing fields", description: "Select an item and enter quantity.", variant: "destructive" });
      return;
    }
    setSavingStock(true);
    try {
      await addDocument("stockEntries", {
        itemId:      stockForm.itemId,
        itemName:    selectedItem?.name ?? "",
        quantity:    stockForm.quantity,
        purchaseDate: stockForm.purchaseDate,
        supplier:    stockForm.supplier    || null,
        costPerUnit: stockForm.costPerUnit || null,
        invoiceNo:   stockForm.invoiceNo   || null,
        addedBy:     stockForm.addedBy,
        branchId:    currentBranch,
      });
      if (selectedItem) {
        await updateDocument("inventoryItems", selectedItem.id, {
          totalStock:        (selectedItem.totalStock     ?? 0) + stockForm.quantity,
          availableStock:    (selectedItem.availableStock ?? 0) + stockForm.quantity,
          lastRestockedDate: stockForm.purchaseDate,
        });
      }
      toast({ title: "Stock Added", description: `${stockForm.quantity} units added to ${selectedItem?.name}.` });
      setStockForm(EMPTY_STOCK_FORM);
      setIsStockOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to add stock.", variant: "destructive" });
    } finally {
      setSavingStock(false);
    }
  };

  const handleAddItem = async () => {
    if (!itemForm.name.trim()) {
      toast({ title: "Item name required", variant: "destructive" });
      return;
    }
    setSavingItem(true);
    try {
      await addDocument("inventoryItems", {
        name:              itemForm.name.trim(),
        category:          itemForm.category,
        unit:              itemForm.unit,
        totalStock:        0,
        issuedStock:       0,
        availableStock:    0,
        minStockLevel:     itemForm.minStockLevel,
        lastRestockedDate: new Date().toISOString().split("T")[0],
        branchId:          currentBranch,
      });
      toast({ title: "Item Created", description: `${itemForm.name} added to inventory.` });
      setItemForm(EMPTY_ITEM_FORM);
      setIsItemOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to create item.", variant: "destructive" });
    } finally {
      setSavingItem(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Add Item Stock" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/inventory" className="hover:text-[#0D7C8F]">Inventory</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Add Item Stock</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Add Item Stock</h2>
          <div className="flex gap-2">

            {/* Add Stock dialog */}
            <Dialog open={isStockOpen} onOpenChange={setIsStockOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A] gap-2">
                  <TrendingUp className="h-4 w-4" /> Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#0D7C8F]" /> Add Stock to Existing Item
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="space-y-1">
                    <Label>Item *</Label>
                    <Select value={stockForm.itemId} onValueChange={v => setStockForm(f => ({ ...f, itemId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select item..." /></SelectTrigger>
                      <SelectContent>
                        {items.map(i => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} (Current: {i.availableStock ?? 0} {i.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Quantity to Add *</Label>
                      <Input type="number" min={1} value={stockForm.quantity}
                        onChange={e => setStockForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Purchase Date *</Label>
                      <Input type="date" value={stockForm.purchaseDate}
                        onChange={e => setStockForm(f => ({ ...f, purchaseDate: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Supplier</Label>
                    <Input placeholder="Supplier name" value={stockForm.supplier}
                      onChange={e => setStockForm(f => ({ ...f, supplier: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Cost Per Unit (₹)</Label>
                      <Input type="number" min={0} value={stockForm.costPerUnit}
                        onChange={e => setStockForm(f => ({ ...f, costPerUnit: Number(e.target.value) }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Invoice No</Label>
                      <Input placeholder="INV-XXXX" value={stockForm.invoiceNo}
                        onChange={e => setStockForm(f => ({ ...f, invoiceNo: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" onClick={handleAddStock} disabled={savingStock}>
                    {savingStock ? "Adding…" : "Add Stock"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* New Item dialog */}
            <Dialog open={isItemOpen} onOpenChange={setIsItemOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
                  <Plus className="h-4 w-4" /> New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Inventory Item</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="space-y-1">
                    <Label>Item Name *</Label>
                    <Input placeholder="e.g. A4 Paper Reams" value={itemForm.name}
                      onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Category *</Label>
                      <Select value={itemForm.category} onValueChange={v => setItemForm(f => ({ ...f, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ITEM_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Unit</Label>
                      <Select value={itemForm.unit} onValueChange={v => setItemForm(f => ({ ...f, unit: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Min Stock Alert Level</Label>
                    <Input type="number" min={0} value={itemForm.minStockLevel}
                      onChange={e => setItemForm(f => ({ ...f, minStockLevel: Number(e.target.value) }))} />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" onClick={handleAddItem} disabled={savingItem}>
                    {savingItem ? "Creating…" : "Create Item"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Low stock alert */}
        {!loading && lowStockItems.length > 0 && (
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Low Stock Alert</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {lowStockItems.map(i => `${i.name} (${i.availableStock ?? 0} ${i.unit})`).join(" · ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search items..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {ITEM_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Stock table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">
              {loading ? "Loading…" : `Current Stock (${filteredItems.length} item${filteredItems.length !== 1 ? "s" : ""})`}
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Issued</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead className="text-center">Min Level</TableHead>
                <TableHead>Last Restocked</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 opacity-20" />
                      <p>No items found{search || categoryFilter !== "All" ? " matching your filters" : `. Use "New Item" to add one.`}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.map(item => {
                const isLow = (item.availableStock ?? 0) <= (item.minStockLevel ?? 0);
                return (
                  <TableRow key={item.id} className={`hover:bg-slate-50/50 ${isLow ? "bg-amber-50/30" : ""}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1E2A4A]">{item.name}</span>
                        {isLow && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.unit}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] ?? "bg-slate-100 text-slate-700"}`}>
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{item.totalStock ?? 0}</TableCell>
                    <TableCell className="text-center text-amber-600 font-medium">{item.issuedStock ?? 0}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${isLow ? "text-red-600" : "text-green-600"}`}>
                        {item.availableStock ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">{item.minStockLevel}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.lastRestockedDate ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-[#1E2A4A] hover:bg-[#1E2A4A] hover:text-white hover:border-[#1E2A4A]"
                        onClick={() => { setStockForm(f => ({ ...f, itemId: item.id })); setIsStockOpen(true); }}>
                        <Plus className="h-3 w-3" /> Add Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Recent stock entries */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">Recent Stock Entries</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Qty Added</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Cost/Unit</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead>Added By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-muted-foreground text-sm">
                    No stock entries yet.
                  </TableCell>
                </TableRow>
              ) : sortedEntries.map(entry => (
                <TableRow key={entry.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-semibold text-sm text-[#1E2A4A]">{entry.itemName}</TableCell>
                  <TableCell className="text-center font-bold text-green-600">+{entry.quantity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{entry.purchaseDate}</TableCell>
                  <TableCell className="text-sm">{entry.supplier || "—"}</TableCell>
                  <TableCell className="text-right text-sm">
                    {entry.costPerUnit ? `₹${entry.costPerUnit.toLocaleString("en-IN")}` : "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{entry.invoiceNo || "—"}</TableCell>
                  <TableCell className="text-sm">{entry.addedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
