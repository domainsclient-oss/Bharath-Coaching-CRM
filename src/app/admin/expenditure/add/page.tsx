"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight, Save, Check, RotateCcw, IndianRupee,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  EXPENSE_CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS,
  ExpenseCategory, ExpensePaymentMode,
} from "@/data/expenditureData";
import { useBranch } from "@/context/BranchContext";
import { useAuth } from "@/lib/auth-context";
import { addDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

const PAYMENT_MODES: ExpensePaymentMode[] = ["Cash", "UPI", "Cheque", "NEFT", "Card"];

const empty = {
  date: new Date().toISOString().split("T")[0],
  category: "" as ExpenseCategory | "",
  description: "",
  amount: "",
  paymentMode: "" as ExpensePaymentMode | "",
  paidTo: "",
  billNo: "",
  notes: "",
};

export default function AddExpensePage() {
  const { currentBranch } = useBranch();
  const { user } = useAuth();
  const [form,   setForm]   = useState({ ...empty });
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof empty, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.description || !form.amount || !form.paymentMode || !form.paidTo) {
      toast({
        title: "Missing fields",
        description: "Fill in Category, Description, Amount, Payment Mode and Paid To.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await addDocument("expenses", {
        date:        form.date,
        category:    form.category as ExpenseCategory,
        description: form.description,
        amount:      Number(form.amount),
        paymentMode: form.paymentMode as ExpensePaymentMode,
        paidTo:      form.paidTo,
        billNo:      form.billNo  || null,
        notes:       form.notes   || null,
        createdBy:   user?.name   ?? "Admin",
        branchId:    currentBranch,
      });
      setSaved(true);
      toast({
        title: "Expense Saved",
        description: `₹${Number(form.amount).toLocaleString("en-IN")} — ${form.description}`,
      });
    } catch {
      toast({ title: "Error", description: "Failed to save expense.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ ...empty, date: new Date().toISOString().split("T")[0] });
    setSaved(false);
  };

  const fmt = (n: string) =>
    n ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0";

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Add Expense" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/expenditure" className="hover:text-[#0D7C8F]">Expenditure</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Add Expense</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">Add Expense</h2>

        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main form */}
            <div className="lg:col-span-2 space-y-5">

              {/* Category picker */}
              <Card className="border-none shadow-sm">
                <CardHeader className="border-b py-3 px-5">
                  <CardTitle className="text-sm">Category</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => set("category", cat)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ${
                          form.category === cat
                            ? "border-[#0D7C8F] bg-[#0D7C8F]/5 shadow-sm"
                            : "border-transparent bg-white hover:border-slate-200"
                        }`}
                      >
                        <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                        <span className="text-[10px] font-semibold text-[#1E2A4A] leading-tight">
                          {cat}
                        </span>
                      </button>
                    ))}
                  </div>
                  {form.category && (
                    <div className="mt-3">
                      <Badge className={`text-xs ${CATEGORY_COLORS[form.category as ExpenseCategory]}`}>
                        {CATEGORY_ICONS[form.category as ExpenseCategory]} {form.category} selected
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Core details */}
              <Card className="border-none shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={form.date}
                        onChange={e => set("date", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Amount (₹) <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="pl-9"
                          value={form.amount}
                          onChange={e => set("amount", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Brief description of the expense..."
                      value={form.description}
                      onChange={e => set("description", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Paid To <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Vendor / person name"
                        value={form.paidTo}
                        onChange={e => set("paidTo", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Payment Mode <span className="text-red-500">*</span>
                      </Label>
                      <Select value={form.paymentMode} onValueChange={v => set("paymentMode", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_MODES.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Bill / Receipt No
                    </Label>
                    <Input
                      placeholder="e.g. BILL-2026-001 (optional)"
                      value={form.billNo}
                      onChange={e => set("billNo", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Notes
                    </Label>
                    <Textarea
                      placeholder="Additional notes or remarks..."
                      className="h-20 resize-none"
                      value={form.notes}
                      onChange={e => set("notes", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right panel */}
            <div className="space-y-4">
              {/* Summary preview */}
              <Card className="border-none shadow-sm bg-gradient-to-br from-[#1E2A4A] to-[#0D7C8F] text-white">
                <CardContent className="p-5 space-y-3">
                  <p className="text-xs text-white/60 font-bold uppercase">Preview</p>
                  {form.category ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{CATEGORY_ICONS[form.category as ExpenseCategory]}</span>
                      <span className="text-base font-bold">{form.category}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-white/50 italic">No category selected</p>
                  )}
                  <p className="text-3xl font-bold">{fmt(form.amount)}</p>
                  <div className="space-y-1 text-sm text-white/70">
                    <p>📅 {form.date}</p>
                    {form.paidTo && <p>👤 {form.paidTo}</p>}
                    {form.paymentMode && <p>💳 {form.paymentMode}</p>}
                    {form.billNo && <p>🧾 {form.billNo}</p>}
                  </div>
                  {form.description && (
                    <p className="text-xs text-white/60 italic border-t border-white/10 pt-2">
                      {form.description}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Checklist */}
              <Card className="border-none shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Required</p>
                  {[
                    { label: "Category",     done: !!form.category },
                    { label: "Date",         done: !!form.date },
                    { label: "Amount",       done: !!form.amount && Number(form.amount) > 0 },
                    { label: "Description",  done: !!form.description },
                    { label: "Paid To",      done: !!form.paidTo },
                    { label: "Payment Mode", done: !!form.paymentMode },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <div className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-100" : "bg-slate-100"}`}>
                        {done
                          ? <Check className="h-2.5 w-2.5 text-green-600" />
                          : <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        }
                      </div>
                      <span className={done ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {label}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button
                type="submit"
                size="lg"
                disabled={saving}
                className={`w-full gap-2 ${saved ? "bg-green-600 hover:bg-green-700" : "bg-[#1E2A4A] hover:bg-[#0D7C8F]"}`}
              >
                {saving ? "Saving…" : saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Expense</>}
              </Button>

              {saved && (
                <Button type="button" variant="outline" className="w-full gap-2" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" /> Add Another
                </Button>
              )}
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}
