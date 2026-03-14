
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('bharath_edu_session');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === 'ADMIN' || user.role === 'TEACHER') {
        router.push('/admin');
      } else {
        router.push('/student');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading Bharath Edu Portal...</p>
      </div>
    </div>
  );
}
