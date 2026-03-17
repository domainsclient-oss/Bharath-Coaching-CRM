"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Phone, 
  Check, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle,
  Bell,
  Search
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { mockLeads, Lead } from "@/data/leadsData";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function FollowUpRemindersPage() {
  const { currentBranch } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const allLeads = useMemo(() => {
    return mockLeads.filter(l => 
      l.branchId === currentBranch && 
      l.followUpDate && 
      !["Admitted", "Not Interested"].includes(l.status)
    );
  }, [currentBranch]);

  const filteredLeads = useMemo(() => {
    return allLeads.filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.enquiryNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allLeads, searchTerm]);

  const todayStr = new Date().toISOString().split('T')[0];

  const sections = useMemo(() => {
    const overdue: Lead[] = [];
    const today: Lead[] = [];
    const upcoming: Lead[] = [];

    filteredLeads.forEach(lead => {
      if (lead.followUpDate < todayStr) {
        overdue.push(lead);
      } else if (lead.followUpDate === todayStr) {
        today.push(lead);
      } else {
        upcoming.push(lead);
      }
    });

    return { overdue, today, upcoming };
  }, [filteredLeads, todayStr]);

  const handleMarkDone = (lead: Lead) => {
    toast({
      title: "Reminder Completed",
      description: `Follow-up for ${lead.name} marked as done.`,
    });
  };

  const handleCall = (lead: Lead) => {
    window.location.href = `tel:${lead.phone}`;
  };

  const ReminderItem = ({ lead, variant }: { lead: Lead, variant: "overdue" | "today" | "upcoming" }) => (
    <div className={cn(
      "p-4 rounded-xl border-l-4 transition-all hover:shadow-md bg-white border border-slate-200",
      variant === "overdue" ? "border-l-red-500" : 
      variant === "today" ? "border-l-amber-500" : 
      "border-l-slate-300"
    )}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Link href={`/admin/leads/${lead.id}`} className="font-bold text-[#1E2A4A] hover:text-[#0D7C8F] transition-colors">
              {lead.name}
            </Link>
            <Badge variant="secondary" className="text-[10px] h-4">Class {lead.classInterested}</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due: {lead.followUpDate}</span>
          </div>
          {lead.notes && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-1 italic">"{lead.notes}"</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 border-green-200 text-green-700 hover:bg-green-50" onClick={() => handleCall(lead)}>
            <Phone className="h-3.5 w-3.5" /> Call
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50">
                <CalendarIcon className="h-3.5 w-3.5" /> Reschedule
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" initialFocus />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => handleMarkDone(lead)}>
            <Check className="h-3.5 w-3.5" /> Done
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Follow-up Reminders" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground gap-2">
              <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/admin/leads" className="hover:text-[#0D7C8F]">Leads</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-foreground">Reminders</span>
            </div>
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Follow-up Tasks</h2>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search reminders..." 
              className="pl-9 h-10 bg-white" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-sm text-amber-700 flex items-center gap-2">
                <Clock className="h-4 w-4" /> TODAY'S REMINDERS
              </h3>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">{sections.today.length}</Badge>
            </div>
            <div className="space-y-3">
              {sections.today.length > 0 ? (
                sections.today.map(lead => <ReminderItem key={lead.id} lead={lead} variant="today" />)
              ) : (
                <div className="p-8 text-center bg-white/50 rounded-xl border-2 border-dashed border-slate-200">
                  <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">No reminders for today</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> OVERDUE
              </h3>
              <Badge variant="secondary" className="bg-red-100 text-red-700">{sections.overdue.length}</Badge>
            </div>
            <div className="space-y-3">
              {sections.overdue.length > 0 ? (
                sections.overdue.map(lead => <ReminderItem key={lead.id} lead={lead} variant="overdue" />)
              ) : (
                <div className="p-8 text-center bg-white/50 rounded-xl border-2 border-dashed border-slate-200">
                  <Check className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">All caught up!</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-sm text-[#1E2A4A] flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" /> UPCOMING
              </h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600">{sections.upcoming.length}</Badge>
            </div>
            <div className="space-y-3">
              {sections.upcoming.length > 0 ? (
                sections.upcoming.map(lead => <ReminderItem key={lead.id} lead={lead} variant="upcoming" />)
              ) : (
                <div className="p-8 text-center bg-white/50 rounded-xl border-2 border-dashed border-slate-200">
                  <CalendarIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">No upcoming reminders</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}