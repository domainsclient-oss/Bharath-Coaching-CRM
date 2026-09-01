"use client";

import { useState } from "react";
import { PlusCircle, PhoneIncoming, PhoneOutgoing, Phone } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SharedHeader } from "@/components/layout/shared-header";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface LeadDoc   { id: string; name: string; enquiryNo?: string; branchId: string; }
interface CallLogDoc {
  id: string;
  date: string;
  time: string;
  name: string;
  number: string;
  type: "Incoming" | "Outgoing";
  duration?: string;
  outcome: string;
  enquiryId?: string;
  branchId: string;
}

const PhoneLogPage = () => {
  const { currentBranch } = useBranch();
  const { data: allLeads } = useFirestoreCollection<LeadDoc>("enquiries", currentBranch);
  const { data: logs }     = useFirestoreCollection<CallLogDoc>("callLogs", currentBranch);

  const [name,          setName]          = useState("");
  const [number,        setNumber]        = useState("");
  const [type,          setType]          = useState<"Incoming" | "Outgoing">("Incoming");
  const [duration,      setDuration]      = useState("");
  const [outcome,       setOutcome]       = useState("");
  const [linkedEnquiry, setLinkedEnquiry] = useState("");
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState<{ name?: boolean; number?: boolean; outcome?: boolean }>({});

  const handleLogCall = async () => {
    const newErrors = {
      name:    !name.trim(),
      number:  !number.trim(),
      outcome: !outcome.trim(),
    };
    setErrors(newErrors);
    if (newErrors.name || newErrors.number || newErrors.outcome) return;

    setSaving(true);
    try {
      const now = new Date();
      await addDocument("callLogs", {
        date:      `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`,
        time:      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        name:      name.trim(),
        number:    number.trim(),
        type,
        duration:  duration.trim(),
        outcome:   outcome.trim(),
        enquiryId: linkedEnquiry || "",
        branchId:  currentBranch,
      });
      toast({ title: "Call logged successfully" });
      setName(""); setNumber(""); setType("Incoming");
      setDuration(""); setOutcome(""); setLinkedEnquiry(""); setErrors({});
    } catch {
      toast({ title: "Error", description: "Failed to save call log.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Sort logs newest first
  const sortedLogs = [...logs].sort((a, b) => {
    const da = new Date(`${a.date}T${a.time}`).getTime();
    const db = new Date(`${b.date}T${b.time}`).getTime();
    return db - da;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Phone Call Log" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        {/* Log form */}
        <Card>
          <CardHeader>
            <CardTitle>Log a New Call</CardTitle>
            <CardDescription>Quickly add a record of a phone call with a lead or parent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-1 space-y-1">
                <Input
                  placeholder="Name *"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: false })); }}
                  className={errors.name ? "border-red-500 focus-visible:ring-red-400" : ""}
                />
                {errors.name && <p className="text-xs text-red-500">Name is required</p>}
              </div>
              <div className="lg:col-span-1 space-y-1">
                <PhoneInput
                  placeholder="Phone Number *"
                  value={number}
                  onChange={v => { setNumber(v); setErrors(p => ({ ...p, number: false })); }}
                  className={errors.number ? "border-red-500 focus-visible:ring-red-400" : ""}
                />
                {errors.number && <p className="text-xs text-red-500">Phone number is required</p>}
              </div>
              <Select value={type} onValueChange={(v: "Incoming" | "Outgoing") => setType(v)}>
                <SelectTrigger><SelectValue placeholder="Call Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Incoming">Incoming</SelectItem>
                  <SelectItem value="Outgoing">Outgoing</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Duration (e.g., 5m 10s)"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
              <div className="lg:col-span-2 space-y-1">
                <Input
                  placeholder="Outcome / Notes *"
                  value={outcome}
                  onChange={e => { setOutcome(e.target.value); setErrors(p => ({ ...p, outcome: false })); }}
                  className={errors.outcome ? "border-red-500 focus-visible:ring-red-400" : ""}
                />
                {errors.outcome && <p className="text-xs text-red-500">Outcome is required</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={linkedEnquiry} onValueChange={setLinkedEnquiry}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to an existing enquiry (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {allLeads.length === 0 ? (
                    <SelectItem value="_none" disabled>No enquiries found</SelectItem>
                  ) : (
                    allLeads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name}{lead.enquiryNo ? ` (${lead.enquiryNo})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleLogCall} disabled={saving} className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                {saving ? "Saving…" : "Log Call"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Call History */}
        <Card>
          <CardHeader>
            <CardTitle>Call History</CardTitle>
            <CardDescription>
              {sortedLogs.length} call{sortedLogs.length !== 1 ? "s" : ""} logged for {currentBranch} branch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Linked Enquiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Phone className="h-8 w-8 opacity-20" />
                        <p>No call logs yet. Log your first call above.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{log.date}</div>
                        <div className="text-xs text-muted-foreground">{log.time}</div>
                      </TableCell>
                      <TableCell className="font-medium">{log.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{log.number}</TableCell>
                      <TableCell>
                        <Badge variant={log.type === "Incoming" ? "default" : "secondary"} className="gap-1">
                          {log.type === "Incoming"
                            ? <PhoneIncoming className="h-3 w-3" />
                            : <PhoneOutgoing className="h-3 w-3" />}
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.duration || "—"}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{log.outcome}</TableCell>
                      <TableCell>
                        {log.enquiryId ? (
                          <Button variant="link" className="p-0 h-auto text-[#0D7C8F] text-sm" asChild>
                            <Link href={`/admin/leads/${log.enquiryId}`}>
                              {allLeads.find(l => l.id === log.enquiryId)?.name ?? log.enquiryId}
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PhoneLogPage;
