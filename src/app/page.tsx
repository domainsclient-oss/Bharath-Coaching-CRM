
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('sunrise_crm_session');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === 'admin' || user.role === 'teacher') {
        router.push('/admin');
      } else if (user.role === 'student') {
        router.push('/student');
      } else {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#1E2A4A]" />
        <p className="text-muted-foreground font-medium">Loading Bharath Academy Portal...</p>
      </div>
    </div>
  );
}
