
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Phone, 
  Search, 
  ChevronRight, 
  ArrowLeft, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Clock, 
  Plus, 
  Link as LinkIcon,
  Filter,
  User,
  History
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";
import { mockCallLogs, CallLogEntry } from "@/data/callLogsData";
import { mockLeads } from "@/data/leadsData";
import { cn } from "@/lib/utils";

export default function PhoneCallLogPage() {
  const { currentBranch, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    type: "Outgoing" as "Incoming" | "Outgoing",
    duration: "",
    outcome: "",
    linkedEnquiry: "none"
  });

  const filteredLogs = useMemo(() => {
    return mockCallLogs.filter(log => {
      const matchesBranch = log.branchId === currentBranch;
      const matchesSearch = log.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           log.number.includes(searchTerm);
      return matchesBranch && matchesSearch;
    });
  }, [currentBranch, searchTerm]);

  const handleLogCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.number || !formData.outcome) {
      toast({
        variant: "destructive",
        title: "Required Fields",
        description: "Please provide at least a phone number and the outcome.",
      });
      return;
    }

    setIsLogging(true);
    // Simulate Save
    setTimeout(() => {
      toast({
        title: "Call Logged",
        description: `Communication with ${formData.name || formData.number} has been recorded.`,
      });
      setFormData({
        name: "",
        number: "",
        type: "Outgoing",
        duration: "",
        outcome: "",
        linkedEnquiry: "none"
      });
      setIsLogging(false);
    }, 800);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Phone Call Log" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/leads" className="hover:text-[#0D7C8F]">Pipeline</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Phone Log</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Communication Registry</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/leads"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Pipeline</Link>
            </Button>
          </div>
        </div>

        {/* Quick Log Form */}
        <Card className="border-none shadow-sm overflow-hidden bg-white border-l-4 border-[#0D7C8F]">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#1E2A4A]">
              <Phone className="h-5 w-5 text-[#0D7C8F]" /> Quick Log Call
            </CardTitle>
            <CardDescription>Record interaction details immediately after a call.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogCall} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
              <div className="space-y-2 lg:col-span-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Type</Label>
                <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Outgoing">Outgoing</SelectItem>
                    <SelectItem value="Incoming">Incoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 lg:col-span-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Phone Number *</Label>
                <Input 
                  placeholder="98765 43210" 
                  className="h-10" 
                  value={formData.number}
                  onChange={e => setFormData({...formData, number: e.target.value})}
                />
              </div>
              <div className="space-y-2 lg:col-span-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Name (If known)</Label>
                <Input 
                  placeholder="Student/Parent Name" 
                  className="h-10"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2 lg:col-span-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Link Enquiry</Label>
                <Select value={formData.linkedEnquiry} onValueChange={(val) => setFormData({...formData, linkedEnquiry: val})}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unlinked Call</SelectItem>
                    {mockLeads.filter(l => l.branchId === currentBranch).map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.enquiryNo} - {l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 lg:col-span-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Duration</Label>
                <Input 
                  placeholder="e.g. 5m 20s" 
                  className="h-10"
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: e.target.value})}
                />
              </div>
              <div className="lg:col-span-1">
                <Button type="submit" className="w-full bg-[#1E2A4A] hover:bg-[#0D7C8F] h-10 gap-2" disabled={isLogging}>
                  {isLogging ? "Saving..." : <><Plus className="h-4 w-4" /> Log Call</>}
                </Button>
              </div>
              <div className="md:col-span-3 lg:col-span-6 space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Call Outcome / Summary *</Label>
                <Textarea 
                  placeholder="What was discussed? Next steps?" 
                  className="h-20 resize-none"
                  value={formData.outcome}
                  onChange={e => setFormData({...formData, outcome: e.target.value})}
                />
              </div>
            </form>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-[#0D7C8F]" />
              <CardTitle className="text-base font-bold">Call History</CardTitle>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search name or number..." 
                className="pl-9 h-9" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[120px]">Date & Time</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="max-w-[300px]">Outcome</TableHead>
                <TableHead>Linked Enquiry</TableHead>
                <TableHead className="text-right">Logged By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-[#1E2A4A]">{log.date}</span>
                        <span className="text-muted-foreground">{log.time}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{log.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{log.number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.type === "Incoming" ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200 gap-1.5 h-6">
                          <PhoneIncoming className="h-3 w-3" /> Incoming
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5 h-6">
                          <PhoneOutgoing className="h-3 w-3" /> Outgoing
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <Clock className="h-3 w-3" /> {log.duration}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-xs text-slate-600 italic line-clamp-2" title={log.outcome}>
                        "{log.outcome}"
                      </p>
                    </TableCell>
                    <TableCell>
                      {log.enquiryNo ? (
                        <Link href={`/admin/leads/${log.enquiryId}`} className="text-xs font-bold text-[#0D7C8F] hover:underline flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" /> {log.enquiryNo}
                        </Link>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic font-medium">Unlinked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground font-medium">
                        <User className="h-3 w-3" /> {log.loggedBy}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No call records found matching your filters.
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
