
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { mockStaff, Staff } from "@/data/hrData";
import { useBranchData } from "@/hooks/use-branch-data";
import { useBranchId } from '@/hooks/use-branch-id';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Save, ArrowLeft, X, Upload } from 'lucide-react';
import Link from 'next/link';

const staffSchema = z.object({
    name: z.string().min(2, "Name is required"),
    role: z.enum(["Teacher", "Admin", "Support", "Principal"]),
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["Male", "Female", "Other"]),
    phone: z.string().regex(/^\d{10}$/, "Must be a 10-digit phone number"),
    email: z.string().email(),
    address: z.string().min(5, "Address is required"),
    qualification: z.string().min(2, "Qualification is required"),
    experience: z.coerce.number().min(0, "Experience cannot be negative"),
    subjects: z.array(z.string()),
    classes: z.array(z.string()),
    salary: z.coerce.number().min(1000, "Salary seems too low"),
    bankName: z.string().optional(),
    accountNo: z.string().optional(),
    status: z.enum(["Active", "Inactive"]),
    photo: z.string().optional(),
});

const STEPS = [
  { id: 1, name: 'Basic Information' },
  { id: 2, name: 'Academic & Role' },
  { id: 3, name: 'Salary & Financial' },
  { id: 4, name: 'System & Status' },
];

const MultiSelect = ({ value, onChange, placeholder }: { value: string[], onChange: (val: string[]) => void, placeholder: string }) => {
    const [inputValue, setInputValue] = useState('');
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            if (!value.includes(inputValue.trim())) {
                onChange([...value, inputValue.trim()]);
            }
            setInputValue('');
        }
    };
    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    }
    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {value.map(tag => (
                    <Badge key={tag} variant="secondary">{tag} <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} /></Badge>
                ))}
            </div>
            <Input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} />
        </div>
    )
};


const StaffProfilePage = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const staffId = params.id as string;
  const isNew = staffId === 'new';
  const isEdit = searchParams.get('edit') === 'true' || isNew;

  const branchId = useBranchId();
  const { data: staff, setData: setStaff } = useBranchData<Staff>(mockStaff);
  const [currentStaff, setCurrentStaff] = useState<Staff | undefined>(undefined);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!isNew) {
      const foundStaff = staff.find(s => s.id === staffId);
      if (foundStaff) {
        setCurrentStaff(foundStaff);
        reset(foundStaff as any);
      } else {
        router.push('/admin/hr');
      }
    }
  }, [staff, staffId, isNew, router]);

  const { register, handleSubmit, control, formState: { errors }, reset, trigger, getValues, setValue } = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: { subjects: [], classes: [], status: 'Active' },
  });

  const nextStep = async () => {
    let fields: any[] = [];
    if (step === 1) fields = ['name', 'role', 'dob', 'gender', 'phone', 'email', 'address'];
    if (step === 2) fields = ['qualification', 'experience', 'subjects', 'classes'];
    if (step === 3) fields = ['salary'];
    
    const isValid = await trigger(fields);
    if (isValid && step < STEPS.length) {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(s => s - 1);
    }
  };

  const onSubmit = (data: z.infer<typeof staffSchema>) => {
    if (isNew) {
        const newStaffId = `STF${Date.now().toString().slice(-4)}`;
        const newStaff: Staff = { ...currentStaff, ...data, id: newStaffId, staffId: `STF-${newStaffId}`, branchId, contact: data.phone || '', branch: '' };
        setStaff(prev => [...prev, newStaff]);
        alert('New staff member added!');
    } else {
        setStaff(prev => prev.map(s => s.id === staffId ? { ...currentStaff, ...data } as Staff : s));
        alert('Staff profile updated!');
    }
    router.push('/admin/hr');
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (!isNew && !currentStaff) return <p>Loading staff profile...</p>;

  return (
    <div className="space-y-6">
        <Link href="/admin/hr" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Staff Directory
        </Link>

        <Card>
            <CardHeader>
                <CardTitle>{isNew ? 'Add New Staff Member' : (isEdit ? `Edit Profile: ${currentStaff?.name}` : currentStaff?.name)}</CardTitle>
                <CardDescription>{isNew ? 'Follow the steps to add a new staff member to the system.' : `Staff ID: ${currentStaff?.staffId}`}</CardDescription>
            </CardHeader>
        </Card>

        {isEdit ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Stepper */}
                <div className="flex justify-between items-center px-4 py-2 border rounded-md">
                    {STEPS.map((s, index) => (
                        <div key={s.id} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s.id === step ? 'bg-primary text-primary-foreground' : (s.id < step ? 'bg-teal-600 text-white' : 'bg-muted')}`}>
                                {s.id}
                            </div>
                            <p className={`ml-2 ${s.id === step ? 'font-bold' : ''}`}>{s.name}</p>
                           {index < STEPS.length - 1 && <div className="flex-1 h-px bg-border ml-4 w-16 md:w-32" />} 
                        </div>
                    ))}
                </div>

                {/* Form Content */}
                <Card>
                    <CardContent className="pt-6">
                        {step === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2"><Label>Full Name</Label><Input {...register("name")} />{errors.name && <p className='text-red-500 text-xs'>{errors.name.message}</p>}</div>
                                <div className="space-y-2"><Label>Role</Label><Controller name="role" control={control} render={({field}) => <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select a role..."/></SelectTrigger><SelectContent><SelectItem value="Teacher">Teacher</SelectItem><SelectItem value="Admin">Admin</SelectItem><SelectItem value="Support">Support</SelectItem><SelectItem value="Principal">Principal</SelectItem></SelectContent></Select>}/>{errors.role && <p className='text-red-500 text-xs'>{errors.role.message}</p>}</div>
                                <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" {...register("dob")} />{errors.dob && <p className='text-red-500 text-xs'>{errors.dob.message}</p>}</div>
                                <div className="space-y-2"><Label>Gender</Label><Controller name="gender" control={control} render={({field}) => <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select gender..."/></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select>}/>{errors.gender && <p className='text-red-500 text-xs'>{errors.gender.message}</p>}</div>
                                <div className="space-y-2"><Label>Phone Number</Label><Input {...register("phone")} />{errors.phone && <p className='text-red-500 text-xs'>{errors.phone.message}</p>}</div>
                                <div className="space-y-2"><Label>Email Address</Label><Input {...register("email")} />{errors.email && <p className='text-red-500 text-xs'>{errors.email.message}</p>}</div>
                                <div className="space-y-2 md:col-span-2"><Label>Address</Label><Input {...register("address")} />{errors.address && <p className='text-red-500 text-xs'>{errors.address.message}</p>}</div>
                            </div>
                        )}
                         {step === 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-2"><Label>Qualification</Label><Input {...register("qualification")} />{errors.qualification && <p className='text-red-500 text-xs'>{errors.qualification.message}</p>}</div>
                                 <div className="space-y-2"><Label>Experience (in years)</Label><Input type="number" {...register("experience")} />{errors.experience && <p className='text-red-500 text-xs'>{errors.experience.message}</p>}</div>
                                <div className="space-y-2"><Label>Subjects Taught</Label><Controller name="subjects" control={control} render={({field}) => <MultiSelect {...field} placeholder="Type subject and press Enter..." />} /></div>
                                <div className="space-y-2"><Label>Classes Handled</Label><Controller name="classes" control={control} render={({field}) => <MultiSelect {...field} placeholder="Type class and press Enter..." />} /></div>
                            </div>
                        )}
                        {step === 3 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2"><Label>Monthly Salary (INR)</Label><Input type="number" {...register("salary")} />{errors.salary && <p className='text-red-500 text-xs'>{errors.salary.message}</p>}</div>
                                <div className="space-y-2"><Label>Bank Name</Label><Input {...register("bankName")} /></div>
                                <div className="space-y-2"><Label>Bank Account Number</Label><Input {...register("accountNo")} /></div>
                            </div>
                        )}
                         {step === 4 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-2">
                                    <Label>Photo</Label>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16"><AvatarImage src={getValues('photo')} /><AvatarFallback><Upload/></AvatarFallback></Avatar>
                                        <Input type="file" className="max-w-xs" onChange={(e) => { e.target.files && e.target.files[0] && setValue('photo', URL.createObjectURL(e.target.files[0]))}} />
                                    </div>
                                 </div>
                                <div className="space-y-2"><Label>Employment Status</Label><Controller name="status" control={control} render={({field}) => <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select status..."/></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select>}/></div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* Navigation Buttons */}
                <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}><ChevronLeft className="mr-2 h-4 w-4"/> Back</Button>
                    {step < STEPS.length && <Button type="button" onClick={nextStep}>Next <ChevronRight className="ml-2 h-4 w-4"/></Button>}
                    {step === STEPS.length && <Button type="submit"><Save className="mr-2 h-4 w-4"/> {isNew ? 'Save Staff' : 'Update Profile'}</Button>}
                </div>
            </form>
        ) : (
            <Card>
                <CardContent className="pt-6">
                   <div className="flex flex-col md:flex-row items-start gap-8">
                        <div className="flex flex-col items-center w-full md:w-1/4">
                             <Avatar className="w-32 h-32 text-4xl mb-4">
                                <AvatarImage src={currentStaff?.photo} alt={currentStaff?.name} />
                                <AvatarFallback>{getInitials(currentStaff?.name || '')}</AvatarFallback>
                            </Avatar>
                             <Button onClick={() => router.push(`/admin/hr/staff/${staffId}?edit=true`)}>Edit Profile</Button>
                        </div>
                        <div className="w-full md:w-3/4 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            <div className="col-span-2"><strong>Role:</strong> <Badge>{currentStaff?.role}</Badge></div>
                            <div><strong>Phone:</strong> {currentStaff?.phone}</div>
                            <div><strong>Email:</strong> {currentStaff?.email}</div>
                            <div><strong>Gender:</strong> {currentStaff?.gender}</div>
                            <div><strong>Date of Birth:</strong> {currentStaff?.dob}</div>
                            <div className="col-span-2"><strong>Address:</strong> {currentStaff?.address}</div>
                            <div className="border-t col-span-2 my-2"/>
                            <div><strong>Qualification:</strong> {currentStaff?.qualification}</div>
                            <div><strong>Experience:</strong> {currentStaff?.experience} years</div>
                             <div className="col-span-2"><strong>Subjects:</strong> {currentStaff?.subjects?.join(', ')}</div>
                             <div className="col-span-2"><strong>Classes:</strong> {currentStaff?.classes?.join(', ')}</div>
                             <div className="border-t col-span-2 my-2"/>
                              <div><strong>Salary:</strong> {currentStaff?.salary ? `₹${currentStaff.salary.toLocaleString('en-IN')}` : 'N/A'}</div>
                              <div><strong>Bank:</strong> {currentStaff?.bankName || 'N/A'}</div>
                              <div><strong>Account No:</strong> {currentStaff?.accountNo || 'N/A'}</div>
                              <div><strong>Status:</strong> <Badge variant={currentStaff?.status === 'Active' ? 'default' : 'destructive'}>{currentStaff?.status}</Badge></div>
                        </div>
                   </div>
                </CardContent>
            </Card>
        )}
    </div>
  );
};

export default StaffProfilePage;
