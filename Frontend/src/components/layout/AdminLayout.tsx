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
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top Navigation - Full Width */}
      <AdminTopNav 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Fixed Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content - Updated margins and padding */}
      <div className="flex flex-col min-w-0 lg:ml-[280px] transition-all duration-300">
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

