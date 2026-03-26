
"use client";

import { useState } from "react";
import { PlusCircle, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBranchData } from "@/hooks/use-branch-data";
import { mockCallLogs, CallLog } from "@/data/callLogsData";
import { mockLeads } from "@/data/leadsData"; // Assuming this exists to link enquiries

const PhoneLogPage = () => {
  const { data: allLogs } = useBranchData<CallLog>(mockCallLogs);
  const { data: allLeads } = useBranchData(mockLeads);
  const [logs, setLogs] = useState<CallLog[]>(allLogs);
  
  // New log form state
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [type, setType] = useState<"Incoming" | "Outgoing">("Incoming");
  const [duration, setDuration] = useState("");
  const [outcome, setOutcome] = useState("");
  const [linkedEnquiry, setLinkedEnquiry] = useState("");

  const handleLogCall = () => {
    if (!name || !number || !outcome) {
      // Add a toast notification here in a real app
      console.error("Please fill all required fields");
      return;
    }

    const newLog: CallLog = {
      id: `CL${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      name,
      number,
      type,
      duration,
      outcome,
      enquiryId: linkedEnquiry || undefined,
      branchId: (allLeads.find(lead => lead.id === linkedEnquiry)?.branchId as string) || "BR001", // Default or derive branch
    };

    setLogs([newLog, ...logs]);

    // Reset form
    setName("");
    setNumber("");
    setType("Incoming");
    setDuration("");
    setOutcome("");
    setLinkedEnquiry("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Log a New Call</CardTitle>
          <CardDescription>
            Quickly add a record of a phone call with a lead or parent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Input 
              placeholder="Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="lg:col-span-1"
            />
            <Input 
              placeholder="Phone Number" 
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="lg:col-span-1"
            />
             <Select onValueChange={(value: any) => setType(value)} defaultValue={type}>
              <SelectTrigger>
                <SelectValue placeholder="Call Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Incoming">Incoming</SelectItem>
                <SelectItem value="Outgoing">Outgoing</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder="Duration (e.g., 5m 10s)" 
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            <Input 
              placeholder="Outcome / Notes" 
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="lg:col-span-2"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Select onValueChange={setLinkedEnquiry} value={linkedEnquiry}>
              <SelectTrigger>
                <SelectValue placeholder="Link to an existing enquiry (optional)" />
              </SelectTrigger>
              <SelectContent>
                {allLeads.map(lead => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.name} ({lead.enquiryNo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleLogCall} className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Log Call
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
          <CardDescription>
            Recent phone calls across all branches you have access to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Linked Enquiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-medium">{new Date(log.date).toLocaleDateString()}</div>
                    <div className="text-sm text-muted-foreground">{log.time}</div>
                  </TableCell>
                  <TableCell className="font-medium">{log.name}</TableCell>
                  <TableCell className="text-muted-foreground">{log.number}</TableCell>
                  <TableCell>
                    <Badge variant={log.type === "Incoming" ? "default" : "secondary"}>
                      {log.type === "Incoming" ? (
                        <PhoneIncoming className="mr-1 h-3 w-3" />
                      ) : (
                        <PhoneOutgoing className="mr-1 h-3 w-3" />
                      )}
                      {log.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.duration}</TableCell>
                  <TableCell>{log.outcome}</TableCell>
                  <TableCell>
                    {log.enquiryId ? (
                      <Button variant="link" asChild>
                        <Link href={`/admin/leads/${log.enquiryId}`}>
                          {log.enquiryId}
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneLogPage;

