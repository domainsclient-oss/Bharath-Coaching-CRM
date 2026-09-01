"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Plus, Search, ArrowLeftRight,
  CheckCircle2, Clock, AlertTriangle, RotateCcw,
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
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  availableStock: number;
  issuedStock: number;
  totalStock: number;
  branchId: string;
}

interface IssueRecord {
  id: string;
  itemId: string;
  itemName: string;
  issuedTo: string;
  recipientType: "Student" | "Staff" | "Department";
  recipientId?: string;
  quantity: number;
  issueDate: string;
  expectedReturnDate?: string;
  returnDate?: string;
  status: "Issued" | "Returned" | "Lost";
  issuedBy: string;
  branchId: string;
  remarks?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Issued:   "bg-blue-100 text-blue-700",
  Returned: "bg-green-100 text-green-700",
  Lost:     "bg-red-100 text-red-700",
};

const EMPTY_FORM = {
  itemId: "", issuedTo: "", recipientType: "Student" as IssueRecord["recipientType"],
  quantity: 1, issueDate: new Date().toISOString().split("T")[0],
  expectedReturnDate: "", issuedBy: "Admin", remarks: "",
};

export default function IssueItemPage() {
  const { currentBranch } = useBranch();
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isOpen,       setIsOpen]       = useState(false);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);

  const { data: items,   loading: itemsLoading   } = useFirestoreCollection<InventoryItem>("inventoryItems", currentBranch);
  const { data: records, loading: recordsLoading } = useFirestoreCollection<IssueRecord>("issueRecords", currentBranch);

  const loading = itemsLoading || recordsLoading;

  const filtered = useMemo(() =>
    records.filter(r =>
      (statusFilter === "All" || r.status === statusFilter) &&
      (r.itemName.toLowerCase().includes(search.toLowerCase()) ||
       r.issuedTo.toLowerCase().includes(search.toLowerCase()))
    ),
    [records, statusFilter, search]
  );

  const selectedItem = useMemo(() =>
    items.find(i => i.id === form.itemId),
    [items, form.itemId]
  );

  const issuedCount   = records.filter(r => r.status === "Issued").length;
  const returnedCount = records.filter(r => r.status === "Returned").length;
  const lostCount     = records.filter(r => r.status === "Lost").length;

  const handleIssue = async () => {
    if (!form.itemId || !form.issuedTo) {
      toast({ title: "Missing fields", description: "Select an item and recipient.", variant: "destructive" });
      return;
    }
    if (selectedItem && form.quantity > (selectedItem.availableStock ?? 0)) {
      toast({ title: "Insufficient stock", description: `Only ${selectedItem.availableStock} ${selectedItem.unit} available.`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await addDocument("issueRecords", {
        itemId: form.itemId,
        itemName: selectedItem?.name ?? "",
        issuedTo: form.issuedTo,
        recipientType: form.recipientType,
        quantity: form.quantity,
        issueDate: form.issueDate,
        expectedReturnDate: form.expectedReturnDate || null,
        status: "Issued",
        issuedBy: form.issuedBy,
        branchId: currentBranch,
        remarks: form.remarks || null,
      });
      // Update inventory stock counts
      if (selectedItem) {
        await updateDocument("inventoryItems", selectedItem.id, {
          issuedStock:    (selectedItem.issuedStock    ?? 0) + form.quantity,
          availableStock: (selectedItem.availableStock ?? 0) - form.quantity,
        });
      }
      toast({ title: "Item Issued", description: `${selectedItem?.name} issued to ${form.issuedTo}.` });
      setForm(EMPTY_FORM);
      setIsOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to issue item.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async (record: IssueRecord) => {
    try {
      const returnDate = new Date().toISOString().split("T")[0];
      await updateDocument("issueRecords", record.id, {
        status: "Returned",
        returnDate,
      });
      // Restore inventory stock counts
      const inventoryItem = items.find(i => i.id === record.itemId);
      if (inventoryItem) {
        await updateDocument("inventoryItems", inventoryItem.id, {
          issuedStock:    Math.max(0, (inventoryItem.issuedStock    ?? 0) - record.quantity),
          availableStock: (inventoryItem.availableStock ?? 0) + record.quantity,
        });
      }
      toast({ title: "Item Returned", description: "Stock updated successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to mark as returned.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Issue Item" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/inventory" className="hover:text-[#0D7C8F]">Inventory</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Issue Item</span>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Issue Item</h2>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2">
                <Plus className="h-4 w-4" /> Issue Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-[#0D7C8F]" /> Issue Item
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-1">
                  <Label>Item *</Label>
                  <Select value={form.itemId} onValueChange={v => setForm(f => ({ ...f, itemId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {items.filter(i => (i.availableStock ?? 0) > 0).map(i => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name} ({i.availableStock} {i.unit} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedItem && (
                    <p className="text-xs text-muted-foreground">
                      Available: <span className="font-semibold text-green-600">{selectedItem.availableStock} {selectedItem.unit}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Recipient Type *</Label>
                    <Select value={form.recipientType} onValueChange={v => setForm(f => ({ ...f, recipientType: v as IssueRecord["recipientType"] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                        <SelectItem value="Department">Department</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Quantity *</Label>
                    <Input type="number" min={1} max={selectedItem?.availableStock ?? 999}
                      value={form.quantity}
                      onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Issued To *</Label>
                  <Input placeholder="Name of student / staff / department"
                    value={form.issuedTo}
                    onChange={e => setForm(f => ({ ...f, issuedTo: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Issue Date *</Label>
                    <Input type="date" value={form.issueDate}
                      onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Expected Return</Label>
                    <Input type="date" value={form.expectedReturnDate}
                      onChange={e => setForm(f => ({ ...f, expectedReturnDate: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Remarks</Label>
                  <Input placeholder="Optional notes..."
                    value={form.remarks}
                    onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" onClick={handleIssue} disabled={saving}>
                  {saving ? "Issuing…" : "Issue Item"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Currently Issued", value: issuedCount,   icon: Clock,          color: "bg-blue-100 text-blue-600"   },
            { label: "Returned",          value: returnedCount, icon: CheckCircle2,   color: "bg-green-100 text-green-600" },
            { label: "Lost / Missing",    value: lostCount,     icon: AlertTriangle,  color: "bg-red-100 text-red-600"     },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {loading
                    ? <Skeleton className="h-7 w-10 mt-1" />
                    : <p className="text-2xl font-bold text-[#1E2A4A]">{value}</p>
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search item or recipient..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Issued">Issued</SelectItem>
                <SelectItem value="Returned">Returned</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b py-3 px-6">
            <CardTitle className="text-base">
              {loading ? "Loading…" : `Issue Records (${filtered.length})`}
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Issued To</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(9)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length > 0 ? filtered.map(r => (
                <TableRow key={r.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-semibold text-sm text-[#1E2A4A]">{r.itemName}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{r.issuedTo}</p>
                      {r.remarks && <p className="text-xs text-muted-foreground">{r.remarks}</p>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{r.recipientType}</Badge></TableCell>
                  <TableCell className="text-center font-bold">{r.quantity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.issueDate}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.expectedReturnDate || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.returnDate || "—"}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs ${STATUS_COLORS[r.status] ?? ""}`}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === "Issued" && (
                      <Button size="sm" variant="outline"
                        className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-400"
                        onClick={() => handleReturn(r)}>
                        <RotateCcw className="h-3 w-3" /> Return
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No issue records found{search || statusFilter !== "All" ? " matching your filters" : ` for ${currentBranch}`}.
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
