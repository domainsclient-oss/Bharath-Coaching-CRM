
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { Loader2 } from 'lucide-react';
import centerConfig from '../config/centerConfig';

export default function HomePage() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect until loading is false
    if (loading) return;

    // If there is no user, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // If user is present, redirect based on role
    if (role === 'student') {
      router.push('/student/dashboard');
    } else if (['admin', 'super_admin', 'teacher'].includes(role || '')) {
      router.push('/admin/dashboard');
    } else {
      // Fallback for unknown roles or if role is null
      router.push('/login');
    }
  }, [user, loading, role, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="flex items-center space-x-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading {centerConfig.centerName} Portal...</p>
      </div>
    </div>
  );
}
