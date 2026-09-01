"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AccessDenied } from "@/components/auth/access-denied";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { seedFirestore, isAlreadySeeded } from "@/lib/seedFirestore";
import { Database, CheckCircle2, Loader2, AlertTriangle, RefreshCw } from "lucide-react";

export default function SeedPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "checking" | "seeding" | "done" | "error">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [alreadySeeded, setAlreadySeeded] = useState<boolean | null>(null);

  if (user?.role !== "super_admin") return <AccessDenied />;

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleCheck = async () => {
    setStatus("checking");
    setLogs([]);
    addLog("Checking Firestore for existing data...");
    const seeded = await isAlreadySeeded();
    setAlreadySeeded(seeded);
    addLog(seeded
      ? "⚠️  Data already exists in Firestore."
      : "✅ No data found — database is empty and ready to seed."
    );
    setStatus("idle");
  };

  const handleSeed = async () => {
    setStatus("seeding");
    setLogs([]);
    try {
      await seedFirestore(msg => addLog(msg));
      setStatus("done");
      setAlreadySeeded(true);
    } catch (err: any) {
      console.error(err);
      addLog("❌ Error: " + (err?.message ?? "Unknown error"));
      setStatus("error");
    }
  };

  const collections = [
    { name: "students", desc: "5 active students per branch (20 total)", icon: "👩‍🎓" },
    { name: "staff", desc: "5 staff members per branch (20 total)", icon: "👨‍🏫" },
    { name: "fees", desc: "Paid + Unpaid fee records for monthly chart & due alerts", icon: "💳" },
    { name: "enquiries", desc: "5 enquiries per branch with varied sources", icon: "📞" },
    { name: "attendance", desc: "Today's + 3 months of past attendance records", icon: "📋" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Seed Database" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2A4A]">Seed Firestore Database</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Populate all Firestore collections with realistic demo data so the dashboard and all pages show real content.
          </p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(c => (
            <Card key={c.name} className="border border-slate-200 shadow-sm">
              <CardContent className="p-4 flex gap-3 items-start">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-[#1E2A4A] capitalize">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action card */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-[#0D7C8F]" />
              Database Actions
            </CardTitle>
            <CardDescription>
              Use fixed document IDs — safe to re-run, only overwrites existing seed data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleCheck}
                disabled={status === "checking" || status === "seeding"}
                className="gap-2"
              >
                {status === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Check Status
              </Button>

              <Button
                onClick={handleSeed}
                disabled={status === "seeding"}
                className="gap-2 bg-[#0D7C8F] hover:bg-[#0b6a7a] text-white"
              >
                {status === "seeding"
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Database className="h-4 w-4" />
                }
                {alreadySeeded ? "Re-seed Database" : "Seed Database"}
              </Button>
            </div>

            {alreadySeeded !== null && status === "idle" && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                alreadySeeded ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
              }`}>
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {alreadySeeded
                  ? "Data already exists. Clicking Seed will overwrite the existing demo data."
                  : "Database is empty — click Seed Database to populate it."}
              </div>
            )}

            {status === "done" && (
              <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                Seeding complete! Go to the Dashboard to see live data.
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Seeding failed. Check console for details and ensure Firestore rules allow writes.
              </div>
            )}

            {/* Log output */}
            {logs.length > 0 && (
              <div className="bg-slate-950 text-slate-100 rounded-lg p-4 text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className={log.startsWith("✅") ? "text-green-400" : log.startsWith("❌") ? "text-red-400" : log.startsWith("⚠️") ? "text-amber-400" : "text-slate-300"}>
                    {log}
                  </div>
                ))}
                {status === "seeding" && (
                  <div className="text-[#0D7C8F] animate-pulse">Writing to Firestore...</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Firebase rules note */}
        <Card className="border border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Firestore Rules Required</p>
                <p>Make sure your <code className="bg-amber-100 px-1 rounded">firestore.rules</code> allow writes for authenticated super_admin users. If seeding fails with a permission error, temporarily set rules to allow all reads/writes, seed, then restore rules.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
