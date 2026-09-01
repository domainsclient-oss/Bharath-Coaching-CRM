
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { loginUser as apiLogin, logoutUser as apiLogout, onAuthChange, AppUser } from '../services/authService';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { setAuditUser, logAudit } from './auditLogger';
import { releaseUiLock } from './release-ui-lock';

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
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<AppUser, 'uid'>;
            const appUser = { uid: authUser.uid, ...userData };
            setUser(appUser);
            setAuditUser({ name: appUser.name ?? appUser.email, role: appUser.role, branchId: (appUser as any).branchId ?? "" });
          } else {
            // User exists in Auth but not Firestore — create doc and treat as super_admin
            const fallback = { uid: authUser.uid, id: authUser.uid, email: authUser.email || '', role: 'super_admin' as const, name: authUser.displayName || authUser.email || 'Admin', status: 'active' };
            await setDoc(doc(db, 'users', authUser.uid), {
              email: fallback.email, name: fallback.name, role: fallback.role, status: fallback.status, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
            }, { merge: true }).catch(() => {});
            setUser(fallback as AppUser);
            setAuditUser({ name: fallback.name, role: fallback.role, branchId: "" });
          }
        } catch (error: any) {
          console.error('Firestore read failed:', error?.code, '— Check Firestore security rules in Firebase Console');
          setUser({ uid: authUser.uid, email: authUser.email || '', role: 'super_admin', name: authUser.displayName || authUser.email || 'Admin', status: 'active' } as AppUser);
        }
      } else {
        setUser(null);
        setAuditUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await apiLogin(email, password);
    // Audit logged after onAuthChange resolves user — see setAuditUser above
    // Log here with email as a fallback since user object isn't set yet
    logAudit({ user: email, role: "unknown", action: "Login", module: "Auth", details: `Signed in: ${email}`, severity: "Info" });
  };

  const logout = async () => {
    const snap = user;
    await apiLogout();
    if (snap) {
      logAudit({ user: snap.name ?? snap.email, role: snap.role, action: "Logout", module: "Auth", details: `Signed out: ${snap.email}`, severity: "Info", branchId: (snap as any).branchId ?? "" });
    }
    router.push('/login');
    // Logout is triggered from inside a Radix confirm dialog / dropdown, which
    // this navigation unmounts before Radix can undo its body lock. Release it
    // after the unmount settles so /login is interactive immediately.
    requestAnimationFrame(releaseUiLock);
  };

  // Handle redirection logic
   useEffect(() => {
    if (loading) return; // Don't redirect while loading

    const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/setup' || pathname.startsWith('/setup/');

    if (user && isAuthRoute) {
      // If user is logged in, redirect from auth routes to the correct dashboard
      const targetDashboard = user.role === 'student' ? '/student/dashboard' : '/admin/dashboard';
      router.push(targetDashboard);
    } else if (!user && !isAuthRoute) {
      // If user is not logged in and not on an auth route, redirect to login
      router.push('/login');
    }

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
