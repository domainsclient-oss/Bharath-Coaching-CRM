"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Phone, Check, Calendar as CalendarIcon,
  Clock, AlertCircle, Bell, Search,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { updateDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LeadDoc {
  id: string;
  name: string;
  enquiryNo?: string;
  phone?: string;
  classInterested?: string;
  followUpDate?: string;
  status?: string;
  notes?: string;
  branchId: string;
}

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export default function FollowUpRemindersPage() {
  useAuth();
  const { currentBranch } = useBranch();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allData } = useFirestoreCollection<LeadDoc>("enquiries", currentBranch);

  const todayStr = localToday();

  const allLeads = useMemo(() =>
    allData.filter(l =>
      l.followUpDate &&
      !["Admitted", "Not Interested"].includes(l.status ?? "")
    ),
    [allData]
  );

  const filteredLeads = useMemo(() =>
    allLeads.filter(l =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.enquiryNo ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [allLeads, searchTerm]
  );

  const sections = useMemo(() => {
    const overdue:  LeadDoc[] = [];
    const today:    LeadDoc[] = [];
    const upcoming: LeadDoc[] = [];
    filteredLeads.forEach(lead => {
      if (!lead.followUpDate) return;
      if (lead.followUpDate < todayStr)       overdue.push(lead);
      else if (lead.followUpDate === todayStr) today.push(lead);
      else                                     upcoming.push(lead);
    });
    return { overdue, today, upcoming };
  }, [filteredLeads, todayStr]);

  const handleMarkDone = async (lead: LeadDoc) => {
    try {
      await updateDocument("enquiries", lead.id, { followUpDate: "" });
      toast({ title: "Reminder Completed", description: `Follow-up for ${lead.name} marked as done.` });
    } catch {
      toast({ title: "Error", description: "Could not update.", variant: "destructive" });
    }
  };

  const handleReschedule = async (lead: LeadDoc, date: Date | undefined) => {
    if (!date) return;
    const newDate = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    try {
      await updateDocument("enquiries", lead.id, { followUpDate: newDate });
      toast({ title: "Rescheduled", description: `Follow-up for ${lead.name} moved to ${newDate}.` });
    } catch {
      toast({ title: "Error", description: "Could not reschedule.", variant: "destructive" });
    }
  };

  const ReminderItem = ({ lead, variant }: { lead: LeadDoc; variant: "overdue" | "today" | "upcoming" }) => (
    <div className={cn(
      "rounded-xl border border-slate-200 border-l-4 bg-white transition-all hover:shadow-md",
      variant === "overdue" ? "border-l-red-500" :
      variant === "today"   ? "border-l-amber-500" :
      "border-l-slate-300"
    )}>
      <div className="px-4 pt-4 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/admin/leads/${lead.id}`}
            className="font-semibold text-sm text-[#1E2A4A] hover:text-[#0D7C8F] transition-colors leading-snug"
          >
            {lead.name}
          </Link>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] h-5 flex-shrink-0",
              variant === "overdue" ? "bg-red-100 text-red-700" :
              variant === "today"   ? "bg-amber-100 text-amber-700" :
              "bg-slate-100 text-slate-700"
            )}
          >
            {variant === "overdue" ? "Overdue" :
             variant === "today"   ? "Today" :
             lead.classInterested  ? `Class ${lead.classInterested}` : "Upcoming"}
          </Badge>
        </div>

        {lead.phone && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span>{lead.phone}</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>Due: <span className={cn("font-medium", variant === "overdue" ? "text-red-600" : "text-slate-600")}>{lead.followUpDate}</span></span>
        </div>

        {lead.notes && (
          <p className="text-xs text-slate-400 italic line-clamp-1">"{lead.notes}"</p>
        )}
      </div>

      <div className="px-3 pb-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
        <Button
          variant="outline" size="sm"
          className="flex-1 h-8 text-xs gap-1 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
          onClick={() => lead.phone && window.open(`tel:${lead.phone}`, "_self")}
          disabled={!lead.phone}
        >
          <Phone className="h-3 w-3" /> Call
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline" size="sm"
              className="flex-1 h-8 text-xs gap-1 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-700"
            >
              <CalendarIcon className="h-3 w-3" /> Reschedule
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              initialFocus
              disabled={date => date < new Date(new Date().setHours(0,0,0,0))}
              onSelect={date => handleReschedule(lead, date)}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="outline" size="sm"
          className="flex-1 h-8 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-700"
          onClick={() => handleMarkDone(lead)}
        >
          <Check className="h-3 w-3" /> Done
        </Button>
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
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* OVERDUE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> OVERDUE
            </h3>
            <Badge variant="secondary" className="bg-red-100 text-red-700">{sections.overdue.length}</Badge>
          </div>
          {sections.overdue.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.overdue.map(lead => <ReminderItem key={lead.id} lead={lead} variant="overdue" />)}
            </div>
          ) : (
            <div className="p-8 text-center bg-white/50 rounded-xl border-2 border-dashed border-slate-200">
              <Check className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">All caught up!</p>
            </div>
          )}
        </div>

        {/* TODAY + UPCOMING */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
