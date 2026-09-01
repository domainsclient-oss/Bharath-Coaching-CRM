
"use client";

import { LogOut, MapPin, UserCog, BellRing } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useBranch } from '@/context/BranchContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationsPopover } from '@/components/layout/notifications-popover';
import { GlobalSearch } from '@/components/layout/global-search';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface HeaderProps {
  title: string;
}

export function SharedHeader({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const { currentBranch, setBranchId, branches } = useBranch();
  const setBranch = setBranchId;
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur transition-all-150 md:px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            <h1 className="text-xl font-semibold text-primary md:text-2xl">{title}</h1>
            <div className="hidden h-6 w-[1px] bg-border md:block" />
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-secondary" />
              <Select value={currentBranch} onValueChange={setBranch}>
                <SelectTrigger className="h-8 border-none bg-transparent p-0 text-sm font-medium focus:ring-0">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <GlobalSearch />

          <NotificationsPopover />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="group flex items-center gap-2 px-0 transition-all-150 md:px-2">
                <Avatar className="h-9 w-9 border-2 border-primary/10">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {user ? getInitials(user.name) : '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start text-left md:flex">
                  <span className="text-sm font-medium group-hover:text-white">{user?.name}</span>
                  <span className="text-xs text-muted-foreground group-hover:text-white/80">{user?.role}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-semibold text-sm">{user?.name}</p>
                <p className="text-xs text-muted-foreground font-normal capitalize">{user?.role}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/settings')} className="cursor-pointer">
                <UserCog className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/reports/user-log')} className="cursor-pointer">
                <BellRing className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowLogout(true)}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Logout confirmation — outside <header> to prevent focus-trap freeze on Cancel */}
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
    </>
  );
}
