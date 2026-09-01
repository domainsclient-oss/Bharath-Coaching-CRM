'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogOut, ChevronDown, ChevronRight, School } from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSubButton, SidebarRail,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/context/SettingsContext';
import Image from 'next/image';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { navSections, hasAccess, type FlatNavItem } from '@/components/layout/admin-nav';


// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  if (!name) return 'A';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const userRole = user?.role ?? 'admin';

  // Track which sections are open — default open if any child is active
  const defaultOpen: Record<string, boolean> = {};
  navSections.forEach(section => {
    if (section.label) {
      defaultOpen[section.label] = section.items.some(item =>
        pathname === item.href || pathname.startsWith(item.href + '/')
      );
    }
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(defaultOpen);
  const [showLogout, setShowLogout] = useState(false);

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b px-3 py-2">
        <div className="flex items-center">
          {/* Expanded: full logo */}
          <div className="group-data-[collapsible=icon]:hidden">
            <Image
              src="/Logo-bcc.webp"
              alt="Bharath Academy"
              width={160}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          {/* Collapsed: icon-only fallback */}
          <div className="hidden group-data-[collapsible=icon]:flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E2A4A]">
            <School className="h-4 w-4 text-white" />
          </div>
        </div>
      </SidebarHeader>

      {/* Main nav */}
      <SidebarContent className="gap-0">
        {navSections.map((section, si) => {
          if (!hasAccess(section.roles, userRole)) return null;

          // ── Flat items (Dashboard, Settings) ────────────────────────────────
          if (!section.label) {
            const flatItems = section.items as FlatNavItem[];
            return (
              <SidebarGroup key={si} className="py-1 px-2">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {flatItems.map(item => {
                      if (!hasAccess(item.roles, userRole)) return null;
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                      return (
                        <SidebarMenuItem key={item.href}>
                          {/* isActive=false always — we control active bg via className */}
                          <SidebarMenuButton
                            asChild
                            isActive={false}
                            tooltip={item.label}
                            className={
                              isActive
                                ? 'text-[#0D7C8F] font-semibold hover:bg-transparent'
                                : 'text-[#1E2A4A] hover:bg-transparent hover:text-[#0D7C8F]'
                            }
                          >
                            <Link href={item.href}>
                              {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          // ── Collapsible grouped section ──────────────────────────────────────
          const SectionIcon = section.icon;
          const isOpen = !!openSections[section.label];
          const visibleItems = section.items.filter(item => hasAccess(item.roles, userRole));
          if (visibleItems.length === 0) return null;

          // Pick only the single most-specific matching item as active.
          // Exact match wins; among prefix matches, the longest href wins.
          const activeHref = visibleItems.reduce<string | null>((best, item) => {
            const exactMatch  = pathname === item.href;
            const prefixMatch = pathname.startsWith(item.href + '/');
            if (!exactMatch && !prefixMatch) return best;
            if (best === null) return item.href;
            if (pathname === item.href) return item.href;          // exact always beats prefix
            if (item.href.length > best.length) return item.href;  // longer prefix wins
            return best;
          }, null);

          const isSectionActive = activeHref !== null;

          return (
            <SidebarGroup key={section.label} className="py-0 px-2">
              <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.label!)}>

                {/* Group header — no background, dark text */}
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel
                    className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors mt-0.5 hover:bg-transparent
                      ${isSectionActive ? 'text-[#1E2A4A]' : 'text-[#1E2A4A]/60 hover:text-[#1E2A4A]'}`}
                  >
                    <div className="flex items-center gap-2">
                      {SectionIcon && <SectionIcon className="h-4 w-4 flex-shrink-0" />}
                      <span className="group-data-[collapsible=icon]:hidden">{section.label}</span>
                    </div>
                    {isOpen
                      ? <ChevronDown className="h-3 w-3 group-data-[collapsible=icon]:hidden flex-shrink-0" />
                      : <ChevronRight className="h-3 w-3 group-data-[collapsible=icon]:hidden flex-shrink-0" />
                    }
                  </SidebarGroupLabel>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="py-0.5">
                      {visibleItems.map(item => {
                        const isActive = item.href === activeHref;
                        return (
                          <SidebarMenuItem key={`${item.href}-${item.label}`}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={false}
                              className={
                                isActive
                                  ? 'text-[#0D7C8F] font-semibold hover:bg-transparent pl-7'
                                  : 'text-slate-500 hover:bg-transparent hover:text-[#0D7C8F] pl-7'
                              }
                            >
                              <Link href={item.href}>
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="w-full cursor-pointer"
              onClick={() => setShowLogout(true)}
              tooltip="Log out"
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {user ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium truncate">{user?.name ?? 'Admin'}</span>
                <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
              </div>
              <LogOut className="ml-auto h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />

      {/* Logout confirmation */}
      <AlertDialog open={showLogout} onOpenChange={setShowLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#1E2A4A] hover:bg-[#0D7C8F]"
              onClick={logout}
            >
              Yes, Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
