
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Book, Building, Calendar, ClipboardList, DollarSign, GraduationCap, 
    Handshake, Home, Megaphone, Settings, Users, Vote, Warehouse 
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import centerConfig from '../../config/centerConfig';

const navConfig = [
    // Base navigation
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard', feature: null, role: ['admin', 'super_admin'] },
    { href: '/admin/branches', icon: Building, label: 'Branches', feature: 'branches', role: ['super_admin'] },

    // Branch-specific navigation
    { href: '/admin/leads', icon: Handshake, label: 'Leads', feature: 'leads', role: ['admin'] },
    { href: '/admin/admissions', icon: GraduationCap, label: 'Admissions', feature: 'admissions', role: ['admin'] },
    { href: '/admin/students', icon: Users, label: 'Students', feature: 'students', role: ['admin'] },
    { href: '/admin/staff', icon: Users, label: 'Staff', feature: 'staff', role: ['admin'] },
    { href: '/admin/fees', icon: DollarSign, label: 'Fees', feature: 'fees', role: ['admin'] },
    { href: '/admin/inventory', icon: Warehouse, label: 'Inventory', feature: 'inventory', role: ['admin'] },
    { href: '/admin/classes', icon: Book, label: 'Classes', feature: 'classes', role: ['admin'] },
    { href: '/admin/batches', icon: Book, label: 'Batches', feature: 'batches', role: ['admin'] },
    { href: '/admin/timetable', icon: Calendar, label: 'Timetable', feature: 'timetable', role: ['admin'] },
    { href: '/admin/attendance', icon: ClipboardList, label: 'Attendance', feature: 'attendance', role: ['admin'] },
    { href: '/admin/examination', icon: Vote, label: 'Examination', feature: 'examination', role: ['admin'] },
    { href: '/admin/communication', icon: Megaphone, label: 'Communication', feature: 'communication', role: ['admin'] },

    // Super admin settings
    { href: '/admin/settings', icon: Settings, label: 'Settings', feature: 'settings', role: ['super_admin'] },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const userRole = user?.role;

    const getVisibleNavItems = () => {
        return navConfig.filter(item => {
            // Check if user has the required role
            const hasRole = userRole && item.role.includes(userRole);
            if (!hasRole) return false;

            // Check if the feature is enabled (if applicable)
            const featureEnabled = !item.feature || centerConfig.features[item.feature as keyof typeof centerConfig.features];
            if (!featureEnabled) return false;

            return true;
        });
    };

    const navItems = getVisibleNavItems();

    return (
        <aside className="w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
            <div className="h-16 flex items-center justify-center px-4 border-b border-secondary">
                <img src={centerConfig.logo} alt={`${centerConfig.centerName} Logo`} className="h-8 w-auto mr-3" />
                <span className="text-sm font-bold leading-tight">{centerConfig.centerName}</span>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1">
                    {navItems.map(item => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <li key={item.href}>
                                <Link href={item.href} className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-secondary'}`}>
                                    <item.icon className="h-5 w-5 mr-3" />
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}
