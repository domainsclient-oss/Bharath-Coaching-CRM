
import { PortalLayout } from '@/components/layout/portal-layout';
import { StudentSidebar } from '@/components/layout/student-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';

export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout>
      <StudentSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </PortalLayout>
  );
}
