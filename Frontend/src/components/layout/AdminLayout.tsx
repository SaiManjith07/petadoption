import { useState, ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopNav } from './AdminTopNav';

interface AdminLayoutProps {
  children: ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function AdminLayout({ children, onRefresh, isRefreshing = false }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Top Navigation - Fixed at top */}
      <AdminTopNav
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />

      <div className="flex pt-[70px] flex-1">
        {/* Fixed Sidebar Wrapper - Desktop */}
        <div className="hidden lg:block w-[280px] min-h-[calc(100vh-70px)] shrink-0 relative">
          <AdminSidebar
            isOpen={true}
            onClose={() => setSidebarOpen(false)}
            className="lg:absolute lg:top-0 lg:left-0 lg:h-full lg:static lg:shadow-none"
          />
        </div>

        {/* Mobile Sidebar - Absolute overlay */}
        <div className="lg:hidden">
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content - Fluid width, no margins needed because of Flex layout */}
        <div className="flex-1 w-full min-w-0 transition-all duration-300">
          <main className="h-[calc(100vh-70px)] overflow-y-auto overflow-x-hidden bg-[#F9FAFB] w-full">
            <div className="p-4 lg:p-6 w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

