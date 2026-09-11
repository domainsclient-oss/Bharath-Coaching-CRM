
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { loginUser as apiLogin, logoutUser as apiLogout, onAuthChange, AppUser } from '../services/authService';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { setAuditUser } from './auditLogger';
import { releaseUiLock } from './release-ui-lock';
import { isStudentEmail, rollNoFromEmail } from './studentAuth';
import { resolveAuthRedirect, STAFF_LOGIN, STUDENT_LOGIN } from './auth-routes';

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      if (authUser) {
        try {
          // An account on the reserved student domain is a student, full stop.
          // Its Firestore document can never promote it, and a missing document
          // can never fall through to the super_admin bootstrap below.
          //
          // Two signals, because either can be missing. `email` here is the
          // Firestore document's address once one exists, which an admin can
          // edit off the student domain; `role` was resolved upstream from the
          // real Firebase Auth address, so it survives that edit. A student read
          // as staff would be handed the admin dashboard on login.
          const isStudent = isStudentEmail(authUser.email) || authUser.role === 'student';
          const rollNo = rollNoFromEmail(authUser.email) ?? (authUser as { rollNo?: string }).rollNo ?? null;

          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<AppUser, 'uid'>;
            const appUser = {
              uid: authUser.uid,
              ...userData,
              id: authUser.uid,
              ...(isStudent ? { role: 'student' as const, rollNo } : {}),
            } as AppUser;
            setUser(appUser);
            setAuditUser({ name: appUser.name ?? appUser.email, role: appUser.role, branchId: (appUser as any).branchId ?? "" });
          } else if (isStudent) {
            // Student signed in but their user document is gone. Grant the
            // student role only — never write a bootstrap document for them,
            // and never fall through to the super_admin branch below.
            const studentUser = {
              uid: authUser.uid, id: authUser.uid, email: authUser.email || '', role: 'student' as const,
              name: authUser.name || rollNo || 'Student', status: 'active', rollNo,
            } as unknown as AppUser;
            setUser(studentUser);
            setAuditUser({ name: studentUser.name, role: 'student', branchId: (studentUser as any).branchId ?? "" });
          } else {
            // Staff exists in Auth but not Firestore — create doc and treat as super_admin
            const fallback = { uid: authUser.uid, id: authUser.uid, email: authUser.email || '', role: 'super_admin' as const, name: authUser.name || authUser.email || 'Admin', status: 'active' };
            await setDoc(doc(db, 'users', authUser.uid), {
              email: fallback.email, name: fallback.name, role: fallback.role, status: fallback.status, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
            }, { merge: true }).catch(() => {});
            setUser(fallback as AppUser);
            setAuditUser({ name: fallback.name, role: fallback.role, branchId: "" });
          }
        } catch (error: any) {
          console.error('Firestore read failed:', error?.code, '— Check Firestore security rules in Firebase Console');
          setUser({ uid: authUser.uid, id: authUser.uid, email: authUser.email || '', role: isStudentEmail(authUser.email) ? 'student' : 'super_admin', name: authUser.name || authUser.email || 'Admin', status: 'active' } as AppUser);
        }
      } else {
        setUser(null);
        setAuditUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // `loginUser` and `logoutUser` already write the audit entry, and they write a
  // better one: the account's real name, role and branch, read from its user
  // document. Logging again here recorded every sign-in and sign-out twice, once
  // under the person's name and once under their email address, which doubled
  // the counts on the user log and made one person look like two.
  const login = async (email: string, password: string) => {
    await apiLogin(email, password);
  };

  const logout = async () => {
    const snap = user;
    await apiLogout();
    router.push(snap?.role === 'student' ? STUDENT_LOGIN : STAFF_LOGIN);
    // Logout is triggered from inside a Radix confirm dialog / dropdown, which
    // this navigation unmounts before Radix can undo its body lock. Release it
    // after the unmount settles so /login is interactive immediately.
    requestAnimationFrame(releaseUiLock);
  };

  // Keep every session on a page it is entitled to. `replace`, not `push`:
  // a redirect the user never asked for has no business in their history.
  useEffect(() => {
    if (loading) return; // Don't redirect while the session is still resolving

    const destination = resolveAuthRedirect(pathname, user);
    if (destination && destination !== pathname) router.replace(destination);
  }, [user, loading, pathname, router]);


  const value = { user, login, logout, loading };

  // Render a loading screen for the initial auth check
  if (loading) {
      return (
          <div className="h-screen w-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
          </div>
      );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
