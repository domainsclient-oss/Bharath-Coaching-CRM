
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { mockStudentProfile } from "@/data/studentPortalData";
import { mockStudents } from "@/data/studentsData"; // Assuming student details are in studentsData
import { User, Mail, Phone, Home, Users, Briefcase, Building } from 'lucide-react';
import Link from "next/link";

const StudentProfilePage = () => {
  // In a real app, you'd get the studentId from the auth context
  const studentId = mockStudentProfile.id;
  const studentDetails = mockStudents.find(s => s.id === studentId);

  if (!studentDetails) {
    return <p>Student profile not found.</p>;
  }

  const { name, photoUrl, class: studentClass, branch } = mockStudentProfile;
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

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

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Profile</h1>

        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Avatar and Basic Info */}
                    <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-32 w-32 border-4 border-primary/20">
                            <AvatarImage src={photoUrl} />
                            <AvatarFallback className="text-4xl">{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold text-center">{studentDetails.name}</h2>
                        <p className="text-muted-foreground">Student ID: {studentDetails.studentId}</p>
                        <div>
                             <Badge className="mr-2">Class: {studentClass}</Badge>
                             <Badge variant="secondary">Branch: {branch}</Badge>
                        </div>
                    </div>

                    {/* Detailed Info */}
                    <div className="flex-1 space-y-6">
                        {/* Personal Information */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center"><User className="mr-2 h-4 w-4"/> Personal Details</h3>
                            <InfoRow icon={<></>} label="Date of Birth" value={studentDetails.dob} />
                            <InfoRow icon={<></>} label="Gender" value={studentDetails.gender} />
                            <InfoRow icon={<Mail className="h-4 w-4"/>} label="Email" value={studentDetails.email} />
                            <InfoRow icon={<Phone className="h-4 w-4"/>} label="Phone" value={studentDetails.phone} />
                        </div>

                         {/* Address Information */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center"><Home className="mr-2 h-4 w-4"/> Address</h3>
                            <InfoRow icon={<></>} label="Address" value={typeof studentDetails.address === 'string' ? studentDetails.address : studentDetails.address ? `${(studentDetails.address as any).street || ''}, ${(studentDetails.address as any).city || ''}, ${(studentDetails.address as any).state || ''} - ${(studentDetails.address as any).pincode || ''}` : undefined} />
                        </div>

                        {/* Guardian Information */}
                        <div className="space-y-3">
                           <h3 className="font-semibold flex items-center"><Users className="mr-2 h-4 w-4"/> Guardian Details</h3>
                            <InfoRow icon={<></>} label="Father's Name" value={studentDetails.fatherName} />
                            <InfoRow icon={<Briefcase className="h-4 w-4"/>} label="Father's Occupation" value={studentDetails.fatherOccupation} />
                            <InfoRow icon={<></>} label="Mother's Name" value={studentDetails.motherName} />
                             <InfoRow icon={<Briefcase className="h-4 w-4"/>} label="Mother's Occupation" value={studentDetails.motherOccupation} />
                        </div>
                        
                        {/* Academic Information */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center"><Building className="mr-2 h-4 w-4"/> Academic Background</h3>
                            <InfoRow icon={<></>} label="Date of Joining" value={studentDetails.joinDate} />
                            <InfoRow icon={<></>} label="Previous School" value={studentDetails.previousSchool} />
                            <InfoRow icon={<></>} label="Previous School Marks" value={`${studentDetails.previousSchoolMarks}%`} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

    </div>
  );
}

export default StudentProfilePage;
