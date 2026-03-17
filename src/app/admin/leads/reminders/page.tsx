
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockLeads, Lead } from "@/data/leadsData";
import { useBranchData } from "@/hooks/use-branch-data";
import { Phone, Check, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const RemindersPage = () => {
  const { data: allLeads } = useBranchData<Lead>(mockLeads);
  const [leads, setLeads] = useState<Lead[]>(allLeads.filter(lead => lead.followUpDate && lead.status !== 'Admitted' && lead.status !== 'Not Interested'));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = leads.filter(lead => new Date(lead.followUpDate) < today);
  const todayReminders = leads.filter(lead => new Date(lead.followUpDate).getTime() === today.getTime());
  const upcoming = leads.filter(lead => new Date(lead.followUpDate) > today);

  const handleMarkDone = (id: string) => {
    setLeads(leads.filter(lead => lead.id !== id));
  };

  const handleReschedule = (id: string, newDate: Date) => {
    setLeads(leads.map(lead => 
      lead.id === id ? { ...lead, followUpDate: newDate.toISOString().split('T')[0] } : lead
    ));
  };

  const ReminderCard = ({ lead, color }: { lead: Lead, color: string }) => (
    <Card className="mb-4">
      <CardContent className={cn("p-4 flex flex-col md:flex-row justify-between items-start md:items-center", color)}>
        <div className="mb-4 md:mb-0">
          <p className="font-bold text-lg">{lead.name}</p>
          <p className="text-sm text-muted-foreground">{lead.phone} | Class: {lead.classInterested}</p>
          <p className="text-sm mt-1">Notes: {lead.notes}</p>
        </div>
        <div className="flex items-center space-x-2">
           <Button variant="outline" size="sm"><Phone className="h-4 w-4 mr-1" /> Call</Button>
           <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm"><CalendarIcon className="h-4 w-4 mr-1" /> Reschedule</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                onSelect={(date) => handleReschedule(lead.id, date as Date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={() => handleMarkDone(lead.id)}><Check className="h-4 w-4 mr-1" /> Done</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <Card className="border-red-500 border-2">
        <CardHeader>
          <CardTitle>Overdue Reminders ({overdue.length})</CardTitle>
          <CardDescription>These follow-ups are past their scheduled date.</CardDescription>
        </CardHeader>
        <CardContent>
          {overdue.length > 0 ? (
            overdue.map(lead => <ReminderCard key={lead.id} lead={lead} color="bg-red-50" />)
          ) : (
            <p>No overdue reminders.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-500 border-2">
        <CardHeader>
          <CardTitle>Today's Reminders ({todayReminders.length})</CardTitle>
           <CardDescription>Follow-ups scheduled for today.</CardDescription>
        </CardHeader>
        <CardContent>
          {todayReminders.length > 0 ? (
            todayReminders.map(lead => <ReminderCard key={lead.id} lead={lead} color="bg-amber-50" />)
          ) : (
            <p>No reminders for today.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Reminders ({upcoming.length})</CardTitle>
          <CardDescription>Follow-ups scheduled for the future.</CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length > 0 ? (
            upcoming.map(lead => <ReminderCard key={lead.id} lead={lead} color="" />)
          ) : (
            <p>No upcoming reminders.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RemindersPage;
