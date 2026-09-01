"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Printer, Download, FileText, IndianRupee,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockFeeRecords } from "@/data/feesData";
import { useBranch } from "@/context/BranchContext";
import { useSettings } from "@/context/SettingsContext";

export default function FeesReceiptPage() {
  const { currentBranch } = useBranch();
  const { settings } = useSettings();
  const [classFilter, setClassFilter] = useState("All");
  const [boardFilter, setBoardFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const records = useMemo(() =>
    mockFeeRecords.filter(r =>
      r.branchId === currentBranch &&
      (classFilter === "All" || r.class === classFilter) &&
      (boardFilter === "All" || r.board === boardFilter)
    ),
    [currentBranch, classFilter, boardFilter]
  );

  const selected = useMemo(() =>
    records.find(r => r.id === selectedId) ?? null,
    [records, selectedId]
  );

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const instalmentRows = selected
    ? Object.entries(selected.instalments)
        .filter(([, v]) => v && v.collected)
        .map(([key, v]) => ({
          label: key === "i1" ? "Instalment I" : key === "i2" ? "Instalment II" : "Instalment III",
          ...v!,
        }))
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Fees Receipt" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Fees Receipt</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">Fees Receipt</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — filter + list */}
          <div className="space-y-4">
            {/* Filters */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Class</p>
                  <Select value={classFilter} onValueChange={v => { setClassFilter(v); setSelectedId(null); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["All", "8", "9", "10", "11", "12"].map(c => (
                        <SelectItem key={c} value={c}>
                          {c === "All" ? "All Classes" : `Class ${c}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Board</p>
                  <Select value={boardFilter} onValueChange={v => { setBoardFilter(v); setSelectedId(null); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["All", "CBSE", "ICSE", "State", "Samacheer", "IB"].map(b => (
                        <SelectItem key={b} value={b}>
                          {b === "All" ? "All Boards" : b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Record list */}
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 border-b py-2 px-4">
                <CardTitle className="text-sm">{records.length} Record{records.length !== 1 ? "s" : ""}</CardTitle>
              </CardHeader>
              <div className="divide-y max-h-[420px] overflow-y-auto">
                {records.length > 0 ? records.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selectedId === r.id ? "bg-[#0D7C8F]/5 border-l-2 border-[#0D7C8F]" : ""}`}
                  >
                    <p className="text-sm font-semibold text-[#1E2A4A] truncate">{r.studentName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{r.billNo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">Class {r.class} · {r.board}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs py-0 ${r.balance === 0 ? "text-green-600 border-green-200" : "text-red-500 border-red-200"}`}
                      >
                        {r.balance === 0 ? "Paid" : `Due ${fmt(r.balance)}`}
                      </Badge>
                    </div>
                  </button>
                )) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No records found.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right — Receipt */}
          <div className="lg:col-span-2">
            {!selected ? (
              <Card className="border-none shadow-sm h-64 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Select a record to view the receipt</p>
                </div>
              </Card>
            ) : (
              <>
                <div className="flex justify-end gap-2 mb-3">
                  <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Print
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" /> PDF
                  </Button>
                </div>

                <Card className="border shadow-md">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="bg-[#1E2A4A] text-white p-6 text-center rounded-t-lg">
                      <h1 className="text-xl font-bold">{settings.appName}</h1>
                      <p className="text-sm text-white/70 mt-0.5">{currentBranch} Branch</p>
                      <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">Fee Payment Receipt</p>
                    </div>

                    <div className="p-6 space-y-5">
                      {/* Bill info */}
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-muted-foreground">Bill Number</p>
                          <p className="font-bold text-lg font-mono text-[#0D7C8F]">{selected.billNo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Receipt Date</p>
                          <p className="font-semibold text-sm">
                            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </div>

                      <hr />

                      {/* Student info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Student Name</p>
                          <p className="font-semibold text-[#1E2A4A]">{selected.studentName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Class / Board</p>
                          <p className="font-semibold">Class {selected.class} — {selected.board}</p>
                        </div>
                        {selected.subjects && (
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Subjects</p>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {selected.subjects.map(s => (
                                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <hr />

                      {/* Payments */}
                      <div>
                        <p className="text-xs font-bold uppercase text-muted-foreground mb-3">Payment Details</p>
                        <div className="space-y-2">
                          {instalmentRows.length > 0 ? instalmentRows.map(inst => (
                            <div
                              key={inst.label}
                              className="flex justify-between items-center p-2.5 bg-green-50 rounded-lg border border-green-100"
                            >
                              <div>
                                <p className="text-sm font-semibold text-[#1E2A4A]">{inst.label}</p>
                                <p className="text-xs text-muted-foreground">{inst.date} · {inst.mode}</p>
                              </div>
                              <p className="font-bold text-green-700">{fmt(inst.amount)}</p>
                            </div>
                          )) : (
                            <p className="text-sm text-muted-foreground italic text-center py-4">
                              No payments collected yet.
                            </p>
                          )}
                        </div>
                      </div>

                      <hr />

                      {/* Totals */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Fee</span>
                          <span className="font-semibold">{fmt(selected.totalFee)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Amount Paid</span>
                          <span className="font-semibold text-green-600">{fmt(selected.collected)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold border-t pt-2">
                          <span className={selected.balance > 0 ? "text-red-600" : "text-green-600"}>
                            {selected.balance > 0 ? "Balance Due" : "Fully Paid"}
                          </span>
                          <span className={selected.balance > 0 ? "text-red-600" : "text-green-600"}>
                            {fmt(selected.balance)}
                          </span>
                        </div>
                      </div>

                      {selected.notes && (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                          <p className="text-xs text-amber-700">
                            <span className="font-bold">Note:</span> {selected.notes}
                          </p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="text-center text-xs text-muted-foreground border-t pt-4">
                        <p>This is a computer-generated receipt and does not require a signature.</p>
                        <p className="mt-1 font-medium">{settings.appName} · {currentBranch}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
