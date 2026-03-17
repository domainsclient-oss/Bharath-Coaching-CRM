
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronRight, 
  Save, 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  BookOpen, 
  Calendar,
  X,
  Plus
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { mockStaff } from "@/data/hrData";
import { LeadSource } from "@/data/leadsData";

const SOURCES: LeadSource[] = [
  "Walk-in", "Phone Call", "WhatsApp Enquiry", "Social Media", 
  "Student Referral", "School Reference", "Banner / Sunpack", 
  "Pamphlet", "Google (SEO)", "Website", "Old Students"
];

export default function AddEnquiryPage() {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjectInput, setSubjectInput] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    classInterested: "",
    board: "CBSE",
    parentName: "",
    phone: "",
    whatsapp: "",
    email: "",
    source: "" as LeadSource | "",
    referredBy: "",
    subjects: [] as string[],
    mode: "Either" as "Online" | "Offline" | "Either",
    assignedTo: "",
    followUpDate: "",
    notes: ""
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSubject = () => {
    if (subjectInput && !formData.subjects.includes(subjectInput)) {
      updateField("subjects", [...formData.subjects, subjectInput]);
      setSubjectInput("");
    }
  };

  const removeSubject = (sub: string) => {
    updateField("subjects", formData.subjects.filter(s => s !== sub));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.name || !formData.classInterested || !formData.parentName || !formData.phone || !formData.source) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill in all required fields marked with *",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const year = new Date().getFullYear();
    const randomNo = Math.floor(1000 + Math.random() * 9000);
    const enquiryNo = `ENQ-${year}-${randomNo}`;

    toast({
      title: "Enquiry Saved",
      description: `Reference Number: ${enquiryNo}`,
    });

    setIsSubmitting(false);
    router.push("/admin/leads");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="New Enquiry" />
      
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center text-xs text-muted-foreground gap-2">
            <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/leads" className="hover:text-[#0D7C8F]">Enquiry Pipeline</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">Add New Enquiry</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Record New Enquiry</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/leads"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Pipeline</Link>
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: Personal & Contact */}
            <Card className="border-none shadow-sm h-fit">
              <CardContent className="p-6 space-y-6">
                <div className="border-b pb-2">
                  <h3 className="font-bold text-[#1E2A4A] flex items-center gap-2">
                    <User className="h-4 w-4 text-[#0D7C8F]" /> Student & Parent Details
                  </h3>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Student Full Name *</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter student name" 
                      value={formData.name}
                      onChange={e => updateField("name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input 
                        id="age" 
                        type="number" 
                        placeholder="e.g. 15" 
                        value={formData.age}
                        onChange={e => updateField("age", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Interested Class *</Label>
                      <Select 
                        value={formData.classInterested} 
                        onValueChange={val => updateField("classInterested", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {["8", "9", "10", "11", "12"].map(cls => (
                            <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>School Board</Label>
                    <Select 
                      value={formData.board} 
                      onValueChange={val => updateField("board", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Board" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CBSE">CBSE</SelectItem>
                        <SelectItem value="ICSE">ICSE</SelectItem>
                        <SelectItem value="State">State Board</SelectItem>
                        <SelectItem value="IB">IB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                    <Input 
                      id="parentName" 
                      placeholder="Enter parent name" 
                      value={formData.parentName}
                      onChange={e => updateField("parentName", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="phone" 
                          className="pl-10" 
                          placeholder="Primary contact" 
                          value={formData.phone}
                          onChange={e => updateField("phone", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <Input 
                        id="whatsapp" 
                        placeholder="Same as phone?" 
                        value={formData.whatsapp}
                        onChange={e => updateField("whatsapp", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RIGHT COLUMN: Source & Logistics */}
            <Card className="border-none shadow-sm h-fit">
              <CardContent className="p-6 space-y-6">
                <div className="border-b pb-2">
                  <h3 className="font-bold text-[#1E2A4A] flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#0D7C8F]" /> Source & Preferences
                  </h3>
                </div>

                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Lead Source *</Label>
                      <Select 
                        value={formData.source} 
                        onValueChange={val => updateField("source", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="How they found us" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCES.map(src => (
                            <SelectItem key={src} value={src}>{src}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.source === "Student Referral" ? (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                        <Label htmlFor="referredBy">Referred By</Label>
                        <Input 
                          id="referredBy" 
                          placeholder="Student Name / ID" 
                          value={formData.referredBy}
                          onChange={e => updateField("referredBy", e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="email" 
                            className="pl-10" 
                            placeholder="Optional" 
                            value={formData.email}
                            onChange={e => updateField("email", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Subjects Interested</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Type subject & press Enter" 
                        value={subjectInput}
                        onChange={e => setSubjectInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                      />
                      <Button type="button" variant="secondary" size="icon" onClick={addSubject}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {formData.subjects.map(sub => (
                        <Badge key={sub} className="bg-[#1E2A4A] gap-1 px-2 py-1">
                          {sub} <X className="h-3 w-3 cursor-pointer" onClick={() => removeSubject(sub)} />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Mode</Label>
                    <RadioGroup 
                      value={formData.mode} 
                      onValueChange={val => updateField("mode", val)}
                      className="flex gap-6 pt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Offline" id="off" />
                        <Label htmlFor="off" className="cursor-pointer">Offline</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Online" id="on" />
                        <Label htmlFor="on" className="cursor-pointer">Online</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Either" id="ei" />
                        <Label htmlFor="ei" className="cursor-pointer">Either</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Follow-up Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="date" 
                          className="pl-10" 
                          value={formData.followUpDate}
                          onChange={e => updateField("followUpDate", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Assign To</Label>
                      <Select 
                        value={formData.assignedTo} 
                        onValueChange={val => updateField("assignedTo", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Staff Member" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockStaff.filter(s => s.branchId === currentBranch).map(staff => (
                            <SelectItem key={staff.id} value={staff.name}>{staff.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes / Observations</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Add any additional context..." 
                      className="h-24"
                      value={formData.notes}
                      onChange={e => updateField("notes", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex justify-end gap-4 border-t pt-6">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" className="bg-[#0D7C8F] px-8 gap-2" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : <><Save className="h-4 w-4" /> Save Enquiry</>}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
