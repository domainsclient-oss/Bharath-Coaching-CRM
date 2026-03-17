
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Phone, 
  GraduationCap, 
  BookOpen, 
  CreditCard, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Upload,
  Check,
  X,
  Smartphone,
  MapPin,
  Building2,
  Calendar as CalendarIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, name: "Personal", icon: User },
  { id: 2, name: "Contact", icon: Phone },
  { id: 3, name: "Academic", icon: GraduationCap },
  { id: 4, name: "Enrollment", icon: BookOpen },
  { id: 5, name: "Fee Plan", icon: CreditCard },
];

interface StudentFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function StudentForm({ initialData, isEdit = false }: StudentFormProps) {
  const router = useRouter();
  const { currentBranch } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialData || {
    name: "", dob: "", gender: "Male",
    parentName: "", phone: "", whatsapp: "", isWhatsappSame: true,
    email: "", address: "", city: "", pincode: "",
    school: "", class: "", board: "CBSE", medium: "English",
    subjects: [] as string[], mode: "Offline", batchPreference: "",
    docs: { reportCard: false, idProof: false, photo: false },
    feeType: "Standard", totalFee: "", instalmentPlan: "Full", firstDueDate: ""
  });

  const [subjectInput, setSubjectInput] = useState("");

  const updateFormData = (fields: any) => {
    setFormData((prev: any) => ({ ...prev, ...fields }));
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.name || !formData.dob) {
          toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all required personal details." });
          return false;
        }
        break;
      case 2:
        if (!formData.parentName || !formData.phone) {
          toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in parent name and phone number." });
          return false;
        }
        break;
      case 3:
        if (!formData.class || !formData.board) {
          toast({ variant: "destructive", title: "Missing Fields", description: "Please select a class and board." });
          return false;
        }
        break;
    }
    return true;
  };

  const addSubject = () => {
    if (subjectInput && !formData.subjects.includes(subjectInput)) {
      updateFormData({ subjects: [...formData.subjects, subjectInput] });
      setSubjectInput("");
    }
  };

  const removeSubject = (sub: string) => {
    updateFormData({ subjects: formData.subjects.filter((s: string) => s !== sub) });
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    // Simulate save
    const appNo = `APP-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    
    toast({
      title: isEdit ? "Student Updated" : "Student Added",
      description: `Registration Number: ${appNo}`,
    });

    // In a real app: await addDoc(collection(db, `branches/${currentBranch}/students`), { ...formData, appNo, createdAt: new Date() });
    
    router.push("/admin/students");
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2 px-2">
          {STEPS.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  currentStep >= step.id ? "bg-[#0D7C8F] text-white shadow-md" : "bg-slate-200 text-slate-500"
                )}
              >
                {currentStep > step.id ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider hidden sm:block",
                currentStep >= step.id ? "text-[#0D7C8F]" : "text-slate-400"
              )}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2 bg-slate-100 [&>div]:bg-[#0D7C8F]" />
      </div>

      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-6 md:p-8">
          {/* STEP 1: PERSONAL */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="border-b pb-4 mb-6">
                <h3 className="text-lg font-bold text-[#1E2A4A]">Personal Details</h3>
                <p className="text-sm text-muted-foreground">Basic information about the student.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => updateFormData({ name: e.target.value })} 
                    placeholder="Enter student name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input 
                    id="dob" 
                    type="date" 
                    value={formData.dob} 
                    onChange={(e) => updateFormData({ dob: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <RadioGroup 
                    value={formData.gender} 
                    onValueChange={(val) => updateFormData({ gender: val })}
                    className="flex gap-4 pt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Photo Upload</Label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-[#0D7C8F] transition-colors">
                    <Upload className="h-6 w-6 mx-auto text-slate-400 mb-2" />
                    <p className="text-xs text-muted-foreground">Click or drag to upload photo</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONTACT */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="border-b pb-4 mb-6">
                <h3 className="text-lg font-bold text-[#1E2A4A]">Contact Information</h3>
                <p className="text-sm text-muted-foreground">Details for communication with parents.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                  <Input 
                    id="parentName" 
                    value={formData.parentName} 
                    onChange={(e) => updateFormData({ parentName: e.target.value })} 
                    placeholder="Enter parent name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => updateFormData({ email: e.target.value })} 
                    placeholder="parent@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      className="pl-10"
                      value={formData.phone} 
                      onChange={(e) => updateFormData({ phone: e.target.value })} 
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="same" 
                        checked={formData.isWhatsappSame} 
                        onCheckedChange={(val) => updateFormData({ isWhatsappSame: !!val, whatsapp: val ? formData.phone : "" })}
                      />
                      <Label htmlFor="same" className="text-[10px] font-normal cursor-pointer">Same as phone</Label>
                    </div>
                  </div>
                  <Input 
                    id="whatsapp" 
                    value={formData.whatsapp} 
                    disabled={formData.isWhatsappSame}
                    onChange={(e) => updateFormData({ whatsapp: e.target.value })} 
                    placeholder="WhatsApp number"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea 
                    id="address" 
                    value={formData.address} 
                    onChange={(e) => updateFormData({ address: e.target.value })} 
                    placeholder="House No, Street, Landmark"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    value={formData.city} 
                    onChange={(e) => updateFormData({ city: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">PIN Code</Label>
                  <Input 
                    id="pincode" 
                    value={formData.pincode} 
                    onChange={(e) => updateFormData({ pincode: e.target.value })} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ACADEMIC */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="border-b pb-4 mb-6">
                <h3 className="text-lg font-bold text-[#1E2A4A]">Academic Details</h3>
                <p className="text-sm text-muted-foreground">Current school and board information.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="school">School/College Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="school" 
                      className="pl-10"
                      value={formData.school} 
                      onChange={(e) => updateFormData({ school: e.target.value })} 
                      placeholder="e.g. KV Trichy"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select value={formData.class} onValueChange={(val) => updateFormData({ class: val })}>
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
                <div className="space-y-2">
                  <Label>Board *</Label>
                  <Select value={formData.board} onValueChange={(val) => updateFormData({ board: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Board" />
                    </SelectTrigger>
                    <SelectContent>
                      {["CBSE", "ICSE", "State", "IB"].map(board => (
                        <SelectItem key={board} value={board}>{board}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Medium</Label>
                  <Select value={formData.medium} onValueChange={(val) => updateFormData({ medium: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Medium" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ENROLLMENT */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="border-b pb-4 mb-6">
                <h3 className="text-lg font-bold text-[#1E2A4A]">Enrollment Details</h3>
                <p className="text-sm text-muted-foreground">Course selection and logistics.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subjects</Label>
                  <div className="flex gap-2 mb-2">
                    <Input 
                      value={subjectInput} 
                      onChange={(e) => setSubjectInput(e.target.value)} 
                      placeholder="Type subject (e.g. Math) and press Add" 
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                    />
                    <Button type="button" onClick={addSubject} variant="secondary">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-lg min-h-[50px] bg-slate-50">
                    {formData.subjects.length === 0 && <span className="text-xs text-muted-foreground p-2">No subjects added yet...</span>}
                    {formData.subjects.map((sub: string) => (
                      <Badge key={sub} className="bg-[#0D7C8F] flex items-center gap-1">
                        {sub}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeSubject(sub)} />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-3">
                    <Label>Study Mode</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => updateFormData({ mode: "Offline" })}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all",
                          formData.mode === "Offline" ? "border-[#0D7C8F] bg-[#0D7C8F]/5 ring-2 ring-[#0D7C8F]/20" : "border-slate-100 opacity-60"
                        )}
                      >
                        <Building2 className={cn("h-6 w-6 mb-2", formData.mode === "Offline" ? "text-[#0D7C8F]" : "text-slate-400")} />
                        <span className="text-sm font-bold">Offline</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => updateFormData({ mode: "Online" })}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all",
                          formData.mode === "Online" ? "border-[#0D7C8F] bg-[#0D7C8F]/5 ring-2 ring-[#0D7C8F]/20" : "border-slate-100 opacity-60"
                        )}
                      >
                        <Monitor className={cn("h-6 w-6 mb-2", formData.mode === "Online" ? "text-[#0D7C8F]" : "text-slate-400")} />
                        <span className="text-sm font-bold">Online</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch Preference</Label>
                    <Input 
                      id="batch" 
                      value={formData.batchPreference} 
                      onChange={(e) => updateFormData({ batchPreference: e.target.value })} 
                      placeholder="e.g. Evening Batch"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Label>Documents Collected</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.entries(formData.docs).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => updateFormData({ docs: { ...formData.docs, [key]: !value } })}>
                        <Checkbox checked={value as boolean} />
                        <Label className="text-xs font-medium cursor-pointer capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: FEE PLAN */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="border-b pb-4 mb-6">
                <h3 className="text-lg font-bold text-[#1E2A4A]">Fee Plan</h3>
                <p className="text-sm text-muted-foreground">Financial arrangements for the enrollment.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-3">
                  <Label>Fee Type</Label>
                  <RadioGroup 
                    value={formData.feeType} 
                    onValueChange={(val) => updateFormData({ feeType: val })}
                    className="flex gap-8"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Standard" id="std" />
                      <Label htmlFor="std">Standard Batch</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="OneToOne" id="oto" />
                      <Label htmlFor="oto">One-to-One Tuition</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total Fee Amount (₹) *</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="total" 
                      className="pl-10"
                      type="number"
                      value={formData.totalFee} 
                      onChange={(e) => updateFormData({ totalFee: e.target.value })} 
                      placeholder="e.g. 15000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instalment Plan</Label>
                  <Select value={formData.instalmentPlan} onValueChange={(val) => updateFormData({ instalmentPlan: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full">Full Payment</SelectItem>
                      <SelectItem value="2 Parts">2 Instalments</SelectItem>
                      <SelectItem value="3 Parts">3 Instalments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">First Instalment Due Date</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="dueDate" 
                      className="pl-10"
                      type="date"
                      value={formData.firstDueDate} 
                      onChange={(e) => updateFormData({ firstDueDate: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-12 flex items-center justify-between border-t pt-6">
            <Button 
              variant="outline" 
              onClick={handleBack} 
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button 
                onClick={handleNext} 
                className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <Save className="h-4 w-4" /> Save & Finish
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Minimal icons used locally since they aren't imported globally
function IndianRupee({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="m6 13 8.5 8" />
      <path d="M6 13h3" />
      <path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
  );
}

function Monitor({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
  );
}
