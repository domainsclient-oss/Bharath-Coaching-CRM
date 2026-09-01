"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useBranch } from "@/context/BranchContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Save, ArrowLeft, X, AlertCircle } from "lucide-react";
import Link from "next/link";
import { SharedHeader } from "@/components/layout/shared-header";
import { getDocument, addDocument, updateDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneInput } from "@/components/ui/phone-input";

const staffSchema = z.object({
  name:          z.string().min(2, "Name is required"),
  role:          z.enum(["Teacher", "Admin", "Support", "Principal"]),
  dob:           z.string().min(1, "Date of birth is required"),
  gender:        z.enum(["Male", "Female", "Other"]),
  phone:         z.string().min(10, "Enter a valid phone number"),
  email:         z.string().email("Enter a valid email"),
  address:       z.string().min(5, "Address is required"),
  qualification: z.string().min(2, "Qualification is required"),
  experience:    z.coerce.number().min(0, "Experience cannot be negative"),
  subjects:      z.array(z.string()),
  classes:       z.array(z.string()),
  salary:        z.coerce.number().min(1000, "Salary seems too low"),
  bankName:      z.string().optional(),
  accountNo:     z.string().optional(),
  status:        z.enum(["Active", "Inactive"]),
  photo:         z.string().optional(),
});

type StaffForm = z.infer<typeof staffSchema>;

const STEPS = [
  { id: 1, name: "Basic Information" },
  { id: 2, name: "Academic & Role" },
  { id: 3, name: "Salary & Financial" },
  { id: 4, name: "System & Status" },
];

function MultiSelect({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (val: string[]) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState("");
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
    }
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}{" "}
            <X
              className="ml-1 h-3 w-3 cursor-pointer"
              onClick={() => onChange(value.filter((t) => t !== tag))}
            />
          </Badge>
        ))}
      </div>
      <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} />
    </div>
  );
}

export default function StaffProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { currentBranch } = useBranch();

  const isNew  = id === "new";
  const isEdit = searchParams.get("edit") === "true" || isNew;

  const [staffDoc, setStaffDoc]   = useState<any>(null);
  const [loadingDoc, setLoadingDoc] = useState(!isNew);
  const [step, setStep]           = useState(1);
  const [saving, setSaving]       = useState(false);

  const { register, handleSubmit, control, formState: { errors }, reset, trigger, getValues, setValue } =
    useForm<StaffForm>({
      resolver: zodResolver(staffSchema),
      defaultValues: { subjects: [], classes: [], status: "Active" },
    });

  useEffect(() => {
    if (isNew) return;
    setLoadingDoc(true);
    getDocument("staff", id)
      .then((doc: any) => {
        if (!doc) { router.push("/admin/hr"); return; }
        setStaffDoc(doc);
        reset({
          name:          doc.name          ?? "",
          role:          doc.role          ?? "Teacher",
          dob:           doc.dob           ?? "",
          gender:        doc.gender        ?? "Male",
          phone:         doc.phone         ?? "",
          email:         doc.email         ?? "",
          address:       doc.address       ?? "",
          qualification: doc.qualification ?? "",
          experience:    doc.experience    ?? 0,
          subjects:      doc.subjects      ?? [],
          classes:       doc.classes       ?? [],
          salary:        doc.salary        ?? 0,
          bankName:      doc.bankName      ?? "",
          accountNo:     doc.accountNo     ?? "",
          status:        doc.status        ?? "Active",
          photo:         doc.photo         ?? "",
        });
      })
      .finally(() => setLoadingDoc(false));
  }, [id, isNew, reset, router]);

  const nextStep = async () => {
    let fields: any[] = [];
    if (step === 1) fields = ["name", "role", "dob", "gender", "phone", "email", "address"];
    if (step === 2) fields = ["qualification", "experience", "subjects", "classes"];
    if (step === 3) fields = ["salary"];
    const valid = await trigger(fields);
    if (valid && step < STEPS.length) setStep((s) => s + 1);
  };

  const onSubmit = async (data: StaffForm) => {
    setSaving(true);
    try {
      if (isNew) {
        const staffId = `STF-${Date.now().toString().slice(-6)}`;
        await addDocument("staff", {
          ...data,
          staffId,
          branchId: currentBranch,
          contact:  data.phone,
        });
        toast({ title: "Staff Added", description: `${data.name} has been added to the system.` });
      } else {
        await updateDocument("staff", id, data);
        toast({ title: "Profile Updated", description: `${data.name}'s profile has been saved.` });
      }
      router.push("/admin/hr");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not save staff profile." });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (loadingDoc) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
        <SharedHeader title="Staff Profile" />
        <main className="p-4 md:p-6 lg:p-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </main>
      </div>
    );
  }

  const currentPhoto = getValues("photo");

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title={isNew ? "Add Staff" : "Staff Profile"} />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <Link href="/admin/hr" className="flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Staff Directory
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>
              {isNew ? "Add New Staff Member" : (isEdit ? `Edit Profile: ${staffDoc?.name}` : staffDoc?.name)}
            </CardTitle>
            <CardDescription>
              {isNew
                ? "Follow the steps to add a new staff member."
                : `Staff ID: ${staffDoc?.staffId ?? id}`}
            </CardDescription>
          </CardHeader>
        </Card>

        {isEdit ? (
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-6"
          >
            {/* Stepper */}
            <div className="flex border-b border-slate-200">
              {STEPS.map((s) => {
                const isActive = s.id === step;
                const isDone   = s.id < step;
                return (
                  <div key={s.id} className={`flex flex-1 items-center justify-center gap-2 pb-3 pt-2 border-b-2 transition-all ${isActive ? "border-[#0D7C8F]" : "border-transparent"}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${isActive ? "border-[#0D7C8F] text-[#0D7C8F]" : isDone ? "border-slate-400 text-slate-500" : "border-slate-300 text-slate-400"}`}>
                      {isDone ? "✓" : s.id}
                    </span>
                    <p className={`text-sm hidden sm:block ${isActive ? "font-bold text-[#0D7C8F]" : isDone ? "text-slate-500" : "text-slate-400"}`}>
                      {s.name}
                    </p>
                  </div>
                );
              })}
            </div>

            <Card>
              <CardContent className="pt-6">
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input {...register("name")} placeholder="e.g. Priya Sharma" />
                      {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Role *</Label>
                      <Controller name="role" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                          <SelectContent>
                            {["Teacher", "Admin", "Support", "Principal"].map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )} />
                      {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth *</Label>
                      <Input type="date" {...register("dob")} />
                      {errors.dob && <p className="text-red-500 text-xs">{errors.dob.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Gender *</Label>
                      <Controller name="gender" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                      {errors.gender && <p className="text-red-500 text-xs">{errors.gender.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number *</Label>
                      <PhoneInput
                        placeholder="10-digit number"
                        value={getValues("phone") ?? ""}
                        onChange={(v) => setValue("phone", v, { shouldValidate: true })}
                      />
                      {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address *</Label>
                      <Input {...register("email")} placeholder="staff@example.com" />
                      {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Address *</Label>
                      <Input {...register("address")} placeholder="Full address" />
                      {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Qualification *</Label>
                      <Input {...register("qualification")} placeholder="e.g. B.Ed, M.Sc" />
                      {errors.qualification && <p className="text-red-500 text-xs">{errors.qualification.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Experience (years) *</Label>
                      <Input type="number" {...register("experience")} />
                      {errors.experience && <p className="text-red-500 text-xs">{errors.experience.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Subjects Taught</Label>
                      <Controller name="subjects" control={control} render={({ field }) => (
                        <MultiSelect {...field} placeholder="Type subject and press Enter..." />
                      )} />
                    </div>
                    <div className="space-y-2">
                      <Label>Classes Handled</Label>
                      <Controller name="classes" control={control} render={({ field }) => (
                        <MultiSelect {...field} placeholder="Type class and press Enter..." />
                      )} />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Monthly Salary (₹) *</Label>
                      <Input type="number" {...register("salary")} />
                      {errors.salary && <p className="text-red-500 text-xs">{errors.salary.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input {...register("bankName")} placeholder="e.g. State Bank of India" />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Account Number</Label>
                      <Input {...register("accountNo")} placeholder="Account number" />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Photo</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border">
                          <AvatarImage src={currentPhoto} />
                          <AvatarFallback className="bg-slate-100 text-[#1E2A4A] font-bold">
                            {getInitials(getValues("name") || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <Input
                          type="file"
                          accept="image/*"
                          className="max-w-xs"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setValue("photo", URL.createObjectURL(file));
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Employment Status</Label>
                      <Controller name="status" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              {step < STEPS.length ? (
                <Button type="button" onClick={nextStep}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" disabled={saving} onClick={() => handleSubmit(onSubmit)()}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : (isNew ? "Save Staff" : "Update Profile")}
                </Button>
              )}
            </div>
          </form>
        ) : (
          /* View mode */
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="flex flex-col items-center w-full md:w-1/4">
                  <Avatar className="w-32 h-32 text-4xl mb-4 border">
                    <AvatarImage src={staffDoc?.photo} alt={staffDoc?.name} />
                    <AvatarFallback className="bg-[#0D7C8F]/10 text-[#0D7C8F] font-bold text-2xl">
                      {getInitials(staffDoc?.name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    className="bg-[#0D7C8F] hover:bg-[#1E2A4A]"
                    onClick={() => router.push(`/admin/hr/staff/${id}?edit=true`)}
                  >
                    Edit Profile
                  </Button>
                </div>
                <div className="w-full md:w-3/4 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div className="col-span-2">
                    <strong>Role:</strong> <Badge className="ml-2">{staffDoc?.role}</Badge>
                  </div>
                  <div><strong>Phone:</strong> {staffDoc?.phone}</div>
                  <div><strong>Email:</strong> {staffDoc?.email}</div>
                  <div><strong>Gender:</strong> {staffDoc?.gender}</div>
                  <div><strong>Date of Birth:</strong> {staffDoc?.dob}</div>
                  <div className="col-span-2"><strong>Address:</strong> {staffDoc?.address}</div>
                  <div className="border-t col-span-2 my-2" />
                  <div><strong>Qualification:</strong> {staffDoc?.qualification}</div>
                  <div><strong>Experience:</strong> {staffDoc?.experience} years</div>
                  <div className="col-span-2"><strong>Subjects:</strong> {(staffDoc?.subjects ?? []).join(", ") || "—"}</div>
                  <div className="col-span-2"><strong>Classes:</strong> {(staffDoc?.classes ?? []).join(", ") || "—"}</div>
                  <div className="border-t col-span-2 my-2" />
                  <div><strong>Salary:</strong> {staffDoc?.salary ? `₹${Number(staffDoc.salary).toLocaleString("en-IN")}` : "N/A"}</div>
                  <div><strong>Bank:</strong> {staffDoc?.bankName || "N/A"}</div>
                  <div><strong>Account No:</strong> {staffDoc?.accountNo || "N/A"}</div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <Badge variant={staffDoc?.status === "Active" ? "default" : "destructive"} className="ml-2">
                      {staffDoc?.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
