
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Printer, 
  Clock, 
  Calendar,
  Video,
  ExternalLink,
  Filter,
  ArrowLeft
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  mockClasses, 
  TIME_SLOTS, 
  DAYS 
} from "@/data/academicsData";
import { mockOnlineClasses } from "@/data/onlineClassesData";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { cn } from "@/lib/utils";

export default function OnlineTimetablePage() {
  useAuth();
  const { currentBranch } = useBranch();
  const [selectedClassId, setSelectedClassId] = useState<string>("C001");

  const selectedClass = useMemo(() => {
    return mockClasses.find(c => c.id === selectedClassId);
  }, [selectedClassId]);

  // Filter online classes for the selected class and branch
  const branchOnlineClasses = useMemo(() => {
    // For the mock, we map the "class" string (e.g., "10") to the class object name
    const className = selectedClass?.name.split(' ')[1] || "";
    return mockOnlineClasses.filter(oc => 
      oc.branchId === currentBranch && 
      oc.class === className
    );
  }, [selectedClassId, currentBranch, selectedClass]);

  const handlePrint = () => {
    window.print();
  };

  // Helper to map days to full names for matching
  const dayMap: Record<string, string> = {
    "Mon": "Monday",
    "Tue": "Tuesday",
    "Wed": "Wednesday",
    "Thu": "Thursday",
    "Fri": "Friday",
    "Sat": "Saturday"
  };

  // In a real app, the online classes would have a 'day' property. 
  // For this mock view, we'll derive it from the date or use the status to distribute them.
  // To make the grid look populated, I'll use a deterministic distribution for the demo.
  const getSessionInSlot = (day: string, slot: string) => {
    // This is a logic layer to map onlineClasses to the grid
    // Real-world: Each OnlineClass object would have a startTime/day assigned
    return branchOnlineClasses.find(oc => {
      // Logic to place mock data in slots for visualization
      const date = new Date(oc.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return dayName === day && oc.time.includes(slot.split('-')[0].trim());
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Online Timetable" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 print:p-0 print:bg-white">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-1 mb-2 print:hidden">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/online-classes" className="hover:text-[#0D7C8F]">Online Classes</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Timetable</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Virtual Class Schedule</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Print Timetable
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/online-classes"><ArrowLeft className="h-4 w-4 mr-2" /> Back to List</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-sm print:hidden">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="grid gap-2 flex-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Select Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClasses.filter(c => c.branchId === currentBranch).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.board})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-teal-50 px-4 py-2 rounded-lg border border-teal-100 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                  <Video className="h-4 w-4 text-[#0D7C8F]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-teal-700 uppercase font-bold">Online Classes</span>
                  <span className="text-sm font-bold text-[#1E2A4A]">{branchOnlineClasses.length} Scheduled</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timetable Grid */}
        <Card className="border-none shadow-sm overflow-hidden print:shadow-none print:border">
          <div className="bg-[#0D7C8F] text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-white/80" />
              <h3 className="font-bold">Virtual Schedule: {selectedClass?.name}</h3>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-white/20 text-white border-none">{selectedClass?.board}</Badge>
              <Badge className="bg-black/20 text-white border-none">{currentBranch} Branch</Badge>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border p-3 text-xs font-bold text-muted-foreground uppercase w-32">Time Slot</th>
                  {DAYS.map(day => (
                    <th key={day} className="border p-3 text-xs font-bold text-[#1E2A4A] uppercase w-40">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(slot => (
                  <tr key={slot} className="group">
                    <td className="border p-3 text-center bg-slate-50/50">
                      <div className="flex flex-col items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-slate-600">{slot}</span>
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const session = getSessionInSlot(day, slot);
                      const isPast = session?.status === "Ended";
                      
                      return (
                        <td key={`${day}-${slot}`} className="border p-2 h-28 min-w-[160px]">
                          {session ? (
                            <div className={cn(
                              "h-full flex flex-col justify-between p-2 rounded-lg border shadow-sm transition-all",
                              isPast 
                                ? "bg-slate-50 border-slate-200 opacity-60" 
                                : "bg-gradient-to-br from-teal-50 to-white border-teal-100 hover:border-[#0D7C8F]/40"
                            )}>
                              <div className="space-y-1">
                                <div className="flex justify-between items-start">
                                  <Badge className={cn(
                                    "text-[9px] font-bold py-0 h-4",
                                    isPast ? "bg-slate-200 text-slate-600" : "bg-[#0D7C8F] text-white"
                                  )}>
                                    {session.subject}
                                  </Badge>
                                  {session.status === "Live" && (
                                    <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                                  )}
                                </div>
                                <p className={cn(
                                  "text-[10px] font-bold line-clamp-2",
                                  isPast ? "text-slate-500" : "text-[#1E2A4A]"
                                )}>
                                  {session.title}
                                </p>
                                <p className="text-[9px] text-muted-foreground font-medium">
                                  {session.teacherName}
                                </p>
                              </div>
                              
                              <div className="pt-2">
                                <Button 
                                  variant={isPast ? "secondary" : "outline"} 
                                  size="sm" 
                                  disabled={isPast}
                                  className={cn(
                                    "w-full h-7 text-[10px] gap-1.5 font-bold",
                                    !isPast && "border-[#0D7C8F] text-[#0D7C8F] hover:bg-[#0D7C8F] hover:text-white"
                                  )}
                                  onClick={() => window.open(session.meetLink, '_blank')}
                                >
                                  {isPast ? (
                                    <span className="line-through">Join Class</span>
                                  ) : (
                                    <>Join Now <ExternalLink className="h-3 w-3" /></>
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[10px] text-slate-300 italic">No Session</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground print:hidden">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-gradient-to-br from-teal-50 to-white border border-teal-100" />
            <span>Scheduled / Live</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-slate-50 border border-slate-200" />
            <span>Past Session</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-600" />
            <span>Live Indicator</span>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
          }
          aside, header, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
