"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Package, AlertTriangle, TrendingUp, ArrowLeftRight,
  Box, Layers, Tag, ChevronRight as Arrow,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ITEM_CATEGORIES, CATEGORY_COLORS } from "@/data/inventoryData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";

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
  branchId: string;
}

interface IssueRecord {
  id: string;
  itemId: string;
  itemName: string;
  issuedTo: string;
  quantity: number;
  issueDate: string;
  status: "Issued" | "Returned" | "Lost";
  branchId: string;
}

export default function ItemStorePage() {
  const { currentBranch } = useBranch();

  const { data: items,   loading: itemsLoading   } = useFirestoreCollection<InventoryItem>("inventoryItems", currentBranch);
  const { data: issues,  loading: issuesLoading  } = useFirestoreCollection<IssueRecord>("issueRecords", currentBranch);
  const { data: entries, loading: entriesLoading } = useFirestoreCollection<StockEntry>("stockEntries", currentBranch);

  const loading = itemsLoading || issuesLoading || entriesLoading;

  // KPI
  const kpi = useMemo(() => ({
    totalItems:   items.length,
    totalCopies:  items.reduce((s, i) => s + (i.totalStock ?? 0), 0),
    issued:       items.reduce((s, i) => s + (i.issuedStock ?? 0), 0),
    lowStock:     items.filter(i => (i.availableStock ?? 0) <= (i.minStockLevel ?? 0)).length,
    activeIssues: issues.filter(r => r.status === "Issued").length,
  }), [items, issues]);

  // By category — only categories that exist in real data
  const byCategory = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category).filter(Boolean))];
    return cats.map(cat => {
      const catItems = items.filter(i => i.category === cat);
      return {
        cat,
        count:     catItems.length,
        total:     catItems.reduce((s, i) => s + (i.totalStock     ?? 0), 0),
        available: catItems.reduce((s, i) => s + (i.availableStock ?? 0), 0),
        issued:    catItems.reduce((s, i) => s + (i.issuedStock    ?? 0), 0),
      };
    }).filter(c => c.count > 0);
  }, [items]);

  const maxTotal = Math.max(...byCategory.map(c => c.total), 1);

  const lowStockItems = items.filter(i => (i.availableStock ?? 0) <= (i.minStockLevel ?? 0));

  const recentEntries = [...entries]
    .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Item Store" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Stock Management</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Item Store</span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Items",   value: kpi.totalItems,   icon: Package,        color: "text-[#1E2A4A]", bg: "bg-blue-100"   },
            { label: "Total Stock",   value: kpi.totalCopies,  icon: Box,            color: "text-blue-600",  bg: "bg-blue-100"   },
            { label: "Issued Out",    value: kpi.issued,       icon: ArrowLeftRight, color: "text-purple-600",bg: "bg-purple-100" },
            { label: "Active Issues", value: kpi.activeIssues, icon: TrendingUp,     color: "text-teal-600",  bg: "bg-teal-100"   },
            { label: "Low Stock",     value: kpi.lowStock,     icon: AlertTriangle,  color: "text-amber-600", bg: "bg-amber-100"  },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-none shadow-sm">
                <CardContent className="p-3 flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    {loading
                      ? <Skeleton className="h-6 w-10 mt-1" />
                      : <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Add Item",   href: "/admin/inventory/add-item",   icon: Package,        desc: "Create new inventory item"    },
            { label: "Add Stock",  href: "/admin/inventory/stock",      icon: TrendingUp,     desc: "Restock an existing item"     },
            { label: "Issue Item", href: "/admin/inventory/issue",      icon: ArrowLeftRight, desc: "Issue item to staff / student" },
            { label: "Categories", href: "/admin/inventory/categories", icon: Layers,         desc: "Manage item categories"       },
          ].map(q => {
            const Icon = q.icon;
            return (
              <Link key={q.label} href={q.href}>
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#1E2A4A]/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0D7C8F]/10 transition-colors">
                      <Icon className="h-5 w-5 text-[#0D7C8F]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#1E2A4A] group-hover:text-[#0D7C8F] transition-colors">{q.label}</p>
                      <p className="text-[11px] text-muted-foreground">{q.desc}</p>
                    </div>
                    <Arrow className="h-4 w-4 text-muted-foreground group-hover:text-[#0D7C8F] transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* By Category bar chart */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-white border-b py-3 px-6">
            <CardTitle className="text-base font-bold text-[#1E2A4A]">Stock by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)
            ) : byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No inventory items added yet.</p>
            ) : byCategory.map(c => {
              const availPct  = c.total > 0 ? (c.available / c.total) * 100 : 0;
              const issuedPct = c.total > 0 ? (c.issued    / c.total) * 100 : 0;
              const barWidth  = (c.total / maxTotal) * 100;
              const colorClass = CATEGORY_COLORS[c.cat as keyof typeof CATEGORY_COLORS] ?? "bg-slate-100 text-slate-700";
              return (
                <div key={c.cat} className="flex items-center gap-4">
                  <div className="w-32 flex-shrink-0">
                    <Badge className={`text-xs ${colorClass}`}>{c.cat}</Badge>
                  </div>
                  <div className="flex-1">
                    <div className="h-5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-green-400 rounded-l-full transition-all"
                        style={{ width: `${(availPct / 100) * barWidth}%` }}
                      />
                      <div
                        className="h-full bg-amber-400 transition-all"
                        style={{ width: `${(issuedPct / 100) * barWidth}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-36 flex-shrink-0 text-xs text-right space-x-2">
                    <span className="text-green-600 font-semibold">{c.available} avail.</span>
                    <span className="text-amber-600 font-semibold">{c.issued} issued</span>
                  </div>
                </div>
              );
            })}
            <div className="flex gap-4 pt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-400" />Available</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" />Issued</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low stock alert table */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-amber-50 border-b border-amber-100 py-3 px-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base font-bold text-amber-800">Low Stock Alerts</CardTitle>
              </div>
              <Badge className="bg-amber-100 text-amber-700">{loading ? "…" : lowStockItems.length}</Badge>
            </CardHeader>
            {loading ? (
              <CardContent className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </CardContent>
            ) : lowStockItems.length === 0 ? (
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                All items are adequately stocked.
              </CardContent>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Available</TableHead>
                    <TableHead className="text-center">Min Level</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map(item => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <p className="font-semibold text-sm text-[#1E2A4A]">{item.name}</p>
                        <Badge className={`text-[10px] ${CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] ?? "bg-slate-100 text-slate-700"}`}>{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${(item.availableStock ?? 0) === 0 ? "text-red-600" : "text-amber-600"}`}>
                          {item.availableStock ?? 0} {item.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">{item.minStockLevel}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <Link href="/admin/inventory/stock">Restock</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Recent stock entries */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b py-3 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-[#1E2A4A]">Recent Stock Entries</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-[#0D7C8F]" asChild>
                <Link href="/admin/inventory/stock">View All</Link>
              </Button>
            </CardHeader>
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Added</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(4)].map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : recentEntries.length > 0 ? recentEntries.map(e => (
                  <TableRow key={e.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-semibold text-sm text-[#1E2A4A]">{e.itemName}</TableCell>
                    <TableCell className="text-center font-bold text-green-600">+{e.quantity}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.purchaseDate}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.supplier || "—"}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-20 text-sm">No stock entries yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Full item list */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-[#1E2A4A]">
              {loading ? "Loading…" : `${items.length} Item${items.length !== 1 ? "s" : ""} Overview`}
            </CardTitle>
            <Button variant="outline" size="sm" className="text-xs gap-1" asChild>
              <Link href="/admin/inventory/add-item"><Package className="h-3.5 w-3.5" /> Manage Items</Link>
            </Button>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
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
                    {[...Array(7)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 opacity-20" />
                      <p>No inventory items found for {currentBranch}.</p>
                      <p className="text-xs">Add items using the &quot;Add Item&quot; button above.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.map(item => {
                const available  = item.availableStock ?? 0;
                const total      = item.totalStock     ?? 0;
                const pct        = total > 0 ? Math.round((available / total) * 100) : 0;
                const isLow      = available <= (item.minStockLevel ?? 0);
                return (
                  <TableRow key={item.id} className={`hover:bg-slate-50/50 ${isLow ? "bg-amber-50/20" : ""}`}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-[#1E2A4A]">{item.name}</span>
                        {isLow && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] ?? "bg-slate-100 text-slate-700"}`}>
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">{total}</TableCell>
                    <TableCell className="text-center text-sm text-amber-600 font-medium">{item.issuedStock ?? 0}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold text-sm ${available === 0 ? "text-red-500" : isLow ? "text-amber-600" : "text-green-600"}`}>
                        {available}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct > 50 ? "bg-green-400" : pct > 20 ? "bg-amber-400" : "bg-red-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
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
