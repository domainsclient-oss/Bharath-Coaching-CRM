
import { PortalLayout } from '@/components/layout/portal-layout';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout>
      <AdminSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </PortalLayout>
  );
}
