
'use client';

import { useAuth } from '../../lib/auth-context';
import { ChevronsLeft, ChevronsRight, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useSidebar } from '../../context/SidebarContext';
import { useBranchData } from '../../context/BranchContext';

export default function Header() {
    const { user, logout } = useAuth();
    const { branchId, setBranchId, branches } = useBranchData(); // Assuming branches are loaded in this context
    const { isSidebarOpen, toggleSidebar } = useSidebar();

    // Find the current branch name
    const currentBranchName = branches.find(b => b.id === branchId)?.name || 'Select Branch';

    return (
        <header className="flex-1 flex items-center justify-between px-6 py-4 bg-background border-b">
            <div className="flex items-center">
                 <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-4">
                    {isSidebarOpen ? <ChevronsLeft /> : <ChevronsRight />}
                </Button>
                <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">

                {user?.role === 'super_admin' && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">{currentBranchName}</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Select Branch</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {branches.map(branch => (
                                <DropdownMenuItem key={branch.id} onSelect={() => setBranchId(branch.id)}>
                                    {branch.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                           <UserIcon className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
