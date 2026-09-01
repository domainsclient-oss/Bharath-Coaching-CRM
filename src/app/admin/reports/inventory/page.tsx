"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Box, Download, AlertTriangle, Package, ArrowLeftRight } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { toast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  totalStock: number;
  issuedStock: number;
  availableStock: number;
  minStockLevel: number;
  lastRestockedDate?: string;
  branchId: string;
}

interface IssueRecord {
  id: string;
  itemId: string;
  itemName: string;
  issuedTo: string;
  status: "Issued" | "Returned";
  branchId: string;
}

export default function InventoryReportPage() {
  const { currentBranch } = useBranch();

  const { data: items,   loading: itemsLoading   } = useFirestoreCollection<InventoryItem>("inventoryItems", currentBranch);
  const { data: records, loading: recordsLoading } = useFirestoreCollection<IssueRecord>("issueRecords", currentBranch);

  const loading = itemsLoading || recordsLoading;

  const [catF,   setCatF]   = useState("All");
  const [stockF, setStockF] = useState("All");

  const categories = useMemo(() => ["All", ...Array.from(new Set(items.map(i => i.category).filter(Boolean))).sort()], [items]);

  const filtered = useMemo(() =>
    items.filter(i =>
      (catF   === "All" || i.category === catF) &&
      (stockF === "All" ||
        (stockF === "Low"  && i.availableStock <= i.minStockLevel && i.availableStock > 0) ||
        (stockF === "Out"  && i.availableStock === 0) ||
        (stockF === "OK"   && i.availableStock > i.minStockLevel))
    ), [items, catF, stockF]);

  const kpi = useMemo(() => ({
    total:    items.length,
    stock:    items.reduce((s, i) => s + (i.totalStock ?? 0), 0),
    issued:   records.filter(r => r.status === "Issued").length,
    lowStock: items.filter(i => i.availableStock <= i.minStockLevel).length,
  }), [items, records]);

  const catSummary = useMemo(() => {
    const map: Record<string, { count: number; available: number; total: number }> = {};
    items.forEach(i => {
      const cat = i.category ?? "Uncategorized";
      if (!map[cat]) map[cat] = { count: 0, available: 0, total: 0 };
      map[cat].count++;
      map[cat].available += i.availableStock ?? 0;
      map[cat].total     += i.totalStock ?? 0;
    });
    return Object.entries(map).filter(([, d]) => d.count > 0).sort((a, b) => b[1].total - a[1].total);
  }, [items]);

  const handleExport = () => {
    const headers = ["#", "Item", "Category", "Total", "Issued", "Available", "Min Level", "Last Restocked"];
    const rows = filtered.map((item, i) => [
      i + 1, `"${item.name}"`, item.category, item.totalStock, item.issuedStock, item.availableStock, item.minStockLevel, item.lastRestockedDate ?? "—",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "inventory-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Exported", description: `${filtered.length} items exported.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Inventory Report" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/reports" className="hover:text-[#0D7C8F]">Reports</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Inventory</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Items",   value: kpi.total,    color: "text-[#1E2A4A]", bg: "bg-blue-100",  icon: Package       },
            { label: "Total Stock",   value: kpi.stock,    color: "text-teal-600",  bg: "bg-teal-100",  icon: Box           },
            { label: "Active Issues", value: kpi.issued,   color: "text-purple-600",bg: "bg-purple-100",icon: ArrowLeftRight },
            { label: "Low Stock",     value: kpi.lowStock, color: "text-amber-600", bg: "bg-amber-100", icon: AlertTriangle  },
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
                      ? <Skeleton className="h-7 w-10 mt-0.5" />
                      : <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Category bars */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b py-3 px-6">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Stock by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)
            ) : catSummary.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4">No inventory items added yet.</p>
            ) : catSummary.map(([cat, d]) => {
              const pct = d.total > 0 ? Math.round((d.available / d.total) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-4">
                  <span className="w-36 text-xs font-medium text-[#1E2A4A] truncate">{cat}</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 50 ? "bg-green-400" : pct > 20 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold w-20 text-right text-muted-foreground">{d.available}/{d.total} avail.</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Items table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#1E2A4A]">Inventory Items — {filtered.length}</CardTitle>
            <div className="flex gap-2">
              <Select value={catF} onValueChange={setCatF}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Categories" : c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={stockF} onValueChange={setStockF}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Stock</SelectItem>
                  <SelectItem value="OK">OK</SelectItem>
                  <SelectItem value="Low">Low Stock</SelectItem>
                  <SelectItem value="Out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8 bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-1.5"
                onClick={handleExport} disabled={loading || filtered.length === 0}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Issued</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Last Restocked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-20 text-center text-muted-foreground">No items found.</TableCell></TableRow>
              ) : filtered.map((item, i) => {
                const pct = item.totalStock > 0 ? Math.round((item.availableStock / item.totalStock) * 100) : 0;
                const isLow = item.availableStock <= item.minStockLevel;
                return (
                  <TableRow key={item.id} className={`hover:bg-slate-50/50 ${isLow ? "bg-amber-50/20" : ""}`}>
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-[#1E2A4A]">{item.name}</span>
                        {isLow && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                    </TableCell>
                    <TableCell><Badge className="bg-slate-100 text-slate-700 text-[10px]">{item.category}</Badge></TableCell>
                    <TableCell className="text-center font-medium">{item.totalStock}</TableCell>
                    <TableCell className="text-center text-amber-600 font-medium">{item.issuedStock}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold text-sm ${item.availableStock === 0 ? "text-red-500" : isLow ? "text-amber-600" : "text-green-600"}`}>{item.availableStock}</span>
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full">
                          <div className={`h-full rounded-full ${pct > 50 ? "bg-green-400" : pct > 20 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs w-8 text-right">{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.lastRestockedDate ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
