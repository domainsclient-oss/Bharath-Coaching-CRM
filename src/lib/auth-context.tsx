
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { loginUser as apiLogin, logoutUser as apiLogout, onAuthChange, AppUser } from '../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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
            setUser({ uid: authUser.uid, ...userData });
          } else {
            // User exists in Auth but not Firestore — treat as super_admin for setup
            setUser({ uid: authUser.uid, email: authUser.email || '', role: 'super_admin', name: authUser.email || 'Admin' } as AppUser);
          }
        } catch (error: any) {
          console.error('Firestore read failed:', error?.code, '— Check Firestore security rules in Firebase Console');
          // Keep user authenticated even if Firestore read fails, using basic Auth info
          setUser({ uid: authUser.uid, email: authUser.email || '', role: 'super_admin', name: authUser.email || 'Admin' } as AppUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    // The onAuthChange listener will handle the user state update
    await apiLogin(email, password);
  };

  const logout = async () => {
    await apiLogout();
    router.push('/login');
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
