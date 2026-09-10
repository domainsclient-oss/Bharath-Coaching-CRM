'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { STUDENT_LOGIN } from '@/lib/auth-routes';

/**
 * Gate for every page under /student.
 *
 * The auth provider's redirect effect fires only *after* the tree has painted,
 * so a signed-out visitor typing /student/dashboard saw the real dashboard for
 * as long as the client navigation took. This renders nothing but a spinner
 * until the session is known to belong to a student.
 *
 * Anyone who is not a student is sent to the students' front door, never to
 * the CRM. Someone asking for the student portal wants to sign in to the
 * student portal, and a staff session sitting in another tab is no reason to
 * answer with the admin dashboard. `resolveAuthRedirect` leaves a staff
 * session alone at that door, so the two rules meet instead of fighting.
 */
export function RequireStudent({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isStudent = user?.role === 'student';

  useEffect(() => {
    if (loading || isStudent) return;
    router.replace(STUDENT_LOGIN);
  }, [loading, isStudent, router]);

  if (loading || !isStudent) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D7C8F]" />
      </div>
    );
  }

  return <>{children}</>;
}
