import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { UserLayout } from './UserLayout';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopNav } from './AdminTopNav';

interface UserPageWrapperProps {
  children: ReactNode;
}

export function UserPageWrapper({ children }: UserPageWrapperProps) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdminPage = location.pathname.startsWith('/admin');
  const isPublicPage = location.pathname === '/' || 
    location.pathname.startsWith('/auth') || 
    location.pathname === '/policy' || 
    location.pathname === '/safety';
  const isPetDetailPage = location.pathname.match(/^\/pets\/\d+$/);

  // Use UserLayout for authenticated users (not admins) on non-admin, non-public pages
  // Include pet detail pages so they have sidebar and top navbar
  if (isAuthenticated && !isAdmin && !isAdminPage && !isPublicPage) {
    return <UserLayout>{children}</UserLayout>;
  }

  // For admins on non-admin pages (like pet detail), use admin layout
  if (isAdmin && !isAdminPage && !isPublicPage) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* Fixed Sidebar - Desktop */}
        <div className="hidden lg:block">
          <AdminSidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
        </div>
        
        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex flex-col min-w-0 lg:ml-[280px] transition-all duration-300">
          <AdminTopNav 
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
            sidebarOpen={sidebarOpen}
          />
          
          {/* Main Content Area - Scrollable */}
          <main className="flex-1 overflow-y-auto bg-[#F9FAFB] pt-16 min-h-[calc(100vh-4rem)]">
            <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

