
"use client";

import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthProvider } from '@/lib/auth-context';
import { ReactNode } from 'react';

export function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider defaultOpen={true}>
        {children}
      </SidebarProvider>
    </AuthProvider>
  );
}
