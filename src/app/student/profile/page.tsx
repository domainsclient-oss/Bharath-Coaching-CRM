"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentRecord } from "@/hooks/useStudentRecord";
import { User, MapPin, Users, GraduationCap, type LucideIcon } from "lucide-react";

const getInitials = (name: string = '') =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

/** Firestore stores dates as ISO strings, Timestamps or Dates depending on age. */
const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const raw = String(value);
  // Read a plain "YYYY-MM-DD" as a local date. Letting Date parse it treats it
  // as UTC midnight, which shows the previous day west of Greenwich.
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  const parsed = iso ? new Date(+iso[1], +iso[2] - 1, +iso[3]) : new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value: any): string | undefined => {
  const date = toDate(value);
  if (date) return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  return value ? String(value) : undefined;
};

/**
 * An address is a plain string on older records and an object on newer ones.
 * An object earns a labelled row per part; a string is one row of its own.
 */
const addressFields = (address: any): { label: string; value?: string }[] => {
  if (typeof address === 'string' || !address) return [{ label: 'Address', value: address || undefined }];
  return [
    { label: 'Street', value: address.street },
    { label: 'City', value: address.city },
    { label: 'State', value: address.state },
    { label: 'Pincode', value: address.pincode },
  ];
};

/**
 * One labelled row. The label column is a fixed width so every label in the
 * card starts on the same line and every value lines up beside it, whether or
 * not the row has anything to show.
 */
const Field = ({ label, value }: { label: string; value?: string | number | null }) => {
  const shown = value === 0 ? '0' : value;
  return (
    <div className="grid gap-0.5 border-b border-border/60 py-2.5 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={shown ? "text-sm font-medium text-[#1E2A4A] break-words" : "text-sm text-muted-foreground/50"}>
        {shown || 'Not on record'}
      </dd>
    </div>
  );
};

const Section = ({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) => (
  <Card className="border-none shadow-sm">
    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 border-b py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0D7C8F]/10">
        <Icon className="h-4 w-4 text-[#0D7C8F]" />
      </span>
      <CardTitle className="text-base font-bold text-[#1E2A4A]">{title}</CardTitle>
    </CardHeader>
    <CardContent className="py-1">
      <dl>{children}</dl>
    </CardContent>
  </Card>
);

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-6 p-4 md:p-6 lg:p-8">
    <div>
      <h1 className="text-2xl font-bold text-[#1E2A4A]">My Profile</h1>
      <p className="text-muted-foreground">Your record as the academy holds it.</p>
    </div>
    {children}
  </div>
);

const StudentProfilePage = () => {
  const { student, className, loading, unlinked } = useStudentRecord();

  if (loading) {
    return (
      <PageShell>
        <Card className="border-none shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:gap-6">
            <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
            <div className="w-full space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardHeader className="border-b py-3"><Skeleton className="h-5 w-40" /></CardHeader>
              <CardContent className="space-y-3 py-4">
                {[...Array(4)].map((__, j) => <Skeleton key={j} className="h-4 w-full" />)}
              </CardContent>
            </Card>
          ))}
        </div>
      </PageShell>
    );
  }

  if (unlinked || !student) {
    return (
      <PageShell>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your login is not linked to a student record yet. Please contact your branch office.
        </div>
      </PageShell>
    );
  }

  const photoUrl = student.photoUrl ?? student.photo;

  return (
    <PageShell>
      {/* Identity band — who this record belongs to, before any detail. */}
      <Card className="border-none shadow-sm">
        <CardContent className="flex flex-col items-center gap-5 py-6 text-center sm:flex-row sm:text-left">
          <Avatar className="h-24 w-24 shrink-0 border-4 border-[#0D7C8F]/15">
            <AvatarImage src={photoUrl} alt={student.name} />
            <AvatarFallback className="bg-[#1E2A4A] text-2xl font-bold text-white">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <h2 className="truncate text-xl font-bold text-[#1E2A4A]">{student.name}</h2>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge className="bg-[#0D7C8F] hover:bg-[#0D7C8F]">Class {className || '—'}</Badge>
              <Badge variant="secondary">Roll No {student.rollNo || '—'}</Badge>
              {student.status && (
                <Badge variant="outline" className="capitalize">{student.status}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Section icon={User} title="Personal Details">
          <Field label="Date of Birth" value={formatDate(student.dob)} />
          <Field label="Gender" value={student.gender} />
        </Section>

        <Section icon={MapPin} title="Contact & Address">
          <Field label="Email" value={student.email} />
          <Field label="Phone" value={student.phone} />
          {addressFields(student.address).map(f => (
            <Field key={f.label} label={f.label} value={f.value} />
          ))}
        </Section>

        <Section icon={Users} title="Guardian Details">
          <Field label="Father's Name" value={student.fatherName} />
          <Field label="Father's Occupation" value={student.fatherOccupation} />
          <Field label="Mother's Name" value={student.motherName} />
          <Field label="Mother's Occupation" value={student.motherOccupation} />
        </Section>

        <Section icon={GraduationCap} title="Academic Background">
          <Field label="Date of Joining" value={formatDate(student.joinDate ?? student.admissionDate)} />
          <Field label="School" value={student.school} />
          <Field label="Previous School" value={student.previousSchool} />
          <Field
            label="Previous School Marks"
            value={student.previousSchoolMarks != null ? `${student.previousSchoolMarks}%` : undefined}
          />
        </Section>
      </div>
    </PageShell>
  );
};

export default StudentProfilePage;
