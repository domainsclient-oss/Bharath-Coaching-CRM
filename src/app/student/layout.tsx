
import { PortalLayout } from '@/components/layout/portal-layout';
import { StudentSidebar } from '@/components/layout/student-sidebar';
import { RequireStudent } from '@/components/auth/require-student';
import { SidebarInset } from '@/components/ui/sidebar';

export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireStudent>
      <PortalLayout>
        <StudentSidebar />
        {/* The tinted ground is what separates the content from the white
            sidebar panel, on every student page rather than just the dashboard. */}
        <SidebarInset className="flex flex-col min-h-screen bg-[#F5F7FA] min-w-0 overflow-x-hidden">
          {children}
        </SidebarInset>
      </PortalLayout>
    </RequireStudent>
  );
}
