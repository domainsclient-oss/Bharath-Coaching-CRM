
"use client";

import { SidebarProvider } from '@/components/ui/sidebar';
import { ReactNode } from 'react';

export function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      {children}
    </SidebarProvider>
  );
}
