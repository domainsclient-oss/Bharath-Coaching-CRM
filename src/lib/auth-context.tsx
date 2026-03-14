
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'admin' | 'teacher' | 'student';

interface User {
  id: string;
  name: string;
  email?: string;
  rollNo?: string;
  role: UserRole;
  avatar?: string;
  class?: string;
  board?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { id: string; password: string }, role: 'staff' | 'student') => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  currentBranch: string;
  setBranch: (branch: string) => void;
  availableBranches: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TEST_USERS = {
  staff: [
    { email: "admin@center.com", password: "admin123", role: "admin" as const, name: "Admin User", id: "ADM001" },
    { email: "teacher@center.com", password: "teach123", role: "teacher" as const, name: "Priya Sharma", id: "TCH001" },
  ],
  student: [
    { rollNo: "ROLL001", password: "student123", role: "student" as const, name: "Arjun Krishnan", id: "STU001", class: "10", board: "CBSE" },
    { rollNo: "ROLL002", password: "student123", role: "student" as const, name: "Meera Nair", id: "STU002", class: "9", board: "CBSE" },
  ]
};

const BRANCHES = ["Trichy", "Chennai", "Madurai", "Coimbatore"];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBranch, setCurrentBranch] = useState("Trichy");
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('sunrise_crm_session');
    const storedBranch = localStorage.getItem('bharath_academy_branch');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedBranch) {
      setCurrentBranch(storedBranch);
    }
    setIsLoading(false);
  }, []);

  const setBranch = (branch: string) => {
    setCurrentBranch(branch);
    localStorage.setItem('bharath_academy_branch', branch);
  };

  const login = async (credentials: { id: string; password: string }, type: 'staff' | 'student') => {
    await new Promise(resolve => setTimeout(resolve, 800));

    let foundUser = null;
    if (type === 'staff') {
      foundUser = TEST_USERS.staff.find(u => u.email === credentials.id && u.password === credentials.password);
    } else {
      foundUser = TEST_USERS.student.find(u => u.rollNo === credentials.id && u.password === credentials.password);
    }

    if (foundUser) {
      const { password, ...userSession } = foundUser;
      setUser(userSession as User);
      localStorage.setItem('sunrise_crm_session', JSON.stringify(userSession));
      
      if (userSession.role === 'admin' || userSession.role === 'teacher') {
        router.push('/admin');
      } else {
        router.push('/student');
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sunrise_crm_session');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading,
      isAuthenticated: !!user,
      currentBranch,
      setBranch,
      availableBranches: BRANCHES
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
