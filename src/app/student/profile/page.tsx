"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentRecord } from "@/hooks/useStudentRecord";
import { User, Mail, Phone, Home, Users, Briefcase, Building } from 'lucide-react';

const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').toUpperCase();

const formatAddress = (address: any): string | undefined => {
  if (!address) return undefined;
  if (typeof address === 'string') return address;
  const parts = [address.street, address.city, address.state].filter(Boolean).join(', ');
  return address.pincode ? `${parts} - ${address.pincode}` : parts || undefined;
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | undefined }) => (
  <div className="flex items-center text-sm">
      <div className="flex items-center w-1/3 text-muted-foreground">
          {icon}
          <span className="ml-2">{label}</span>
      </div>
      <div className="w-2/3 font-medium">
          {value || '-'}
      </div>
  </div>
);

const StudentProfilePage = () => {
  const { student, className, branchId, loading, unlinked } = useStudentRecord();

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Card><CardContent className="pt-6 space-y-4">
          <Skeleton className="h-32 w-32 rounded-full" />
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </CardContent></Card>
      </div>
    );
  }

  if (unlinked || !student) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Card><CardContent className="pt-6">
          <p className="text-muted-foreground">
            Your login is not linked to a student record yet. Please contact your branch office.
          </p>
        </CardContent></Card>
      </div>
    );
  }

  const photoUrl = student.photoUrl ?? student.photo;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold">My Profile</h1>

        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Avatar and Basic Info */}
                    <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-32 w-32 border-4 border-primary/20">
                            <AvatarImage src={photoUrl} />
                            <AvatarFallback className="text-4xl">{getInitials(student.name)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold text-center">{student.name}</h2>
                        <p className="text-muted-foreground">Roll No: {student.rollNo || '-'}</p>
                        <div>
                             <Badge className="mr-2">Class: {className || '-'}</Badge>
                             <Badge variant="secondary">Branch: {branchId || '-'}</Badge>
                        </div>
                    </div>

                    {/* Detailed Info */}
                    <div className="flex-1 space-y-6">
                        {/* Personal Information */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center"><User className="mr-2 h-4 w-4"/> Personal Details</h3>
                            <InfoRow icon={<></>} label="Date of Birth" value={student.dob} />
                            <InfoRow icon={<></>} label="Gender" value={student.gender} />
                            <InfoRow icon={<Mail className="h-4 w-4"/>} label="Email" value={student.email} />
                            <InfoRow icon={<Phone className="h-4 w-4"/>} label="Phone" value={student.phone} />
                        </div>

                         {/* Address Information */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center"><Home className="mr-2 h-4 w-4"/> Address</h3>
                            <InfoRow icon={<></>} label="Address" value={formatAddress(student.address)} />
                        </div>

                        {/* Guardian Information */}
                        <div className="space-y-3">
                           <h3 className="font-semibold flex items-center"><Users className="mr-2 h-4 w-4"/> Guardian Details</h3>
                            <InfoRow icon={<></>} label="Father's Name" value={student.fatherName} />
                            <InfoRow icon={<Briefcase className="h-4 w-4"/>} label="Father's Occupation" value={student.fatherOccupation} />
                            <InfoRow icon={<></>} label="Mother's Name" value={student.motherName} />
                             <InfoRow icon={<Briefcase className="h-4 w-4"/>} label="Mother's Occupation" value={student.motherOccupation} />
                        </div>

                        {/* Academic Information */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center"><Building className="mr-2 h-4 w-4"/> Academic Background</h3>
                            <InfoRow icon={<></>} label="Date of Joining" value={student.joinDate ?? student.admissionDate} />
                            <InfoRow icon={<></>} label="School" value={student.school} />
                            <InfoRow icon={<></>} label="Previous School" value={student.previousSchool} />
                            <InfoRow
                              icon={<></>}
                              label="Previous School Marks"
                              value={student.previousSchoolMarks != null ? `${student.previousSchoolMarks}%` : undefined}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

    </div>
  );
}

export default StudentProfilePage;
