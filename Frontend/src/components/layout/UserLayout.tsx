import { useState, ReactNode } from 'react';
import { UserSidebar } from './UserSidebar';
import { UserTopNav } from './UserTopNav';

interface UserLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export function UserLayout({ children, title, subtitle, onRefresh }: UserLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Top Navigation - Full Width */}
      <UserTopNav 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen}
        onRefresh={onRefresh}
      />

      {/* Fixed Sidebar */}
      <div className="hidden lg:block">
        <UserSidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content - Updated margins and padding */}
      <div className="flex flex-col min-w-0 lg:ml-[260px] pt-[70px] transition-all duration-300">
        <main className="flex-1 overflow-y-auto bg-[#F5F7FA] min-h-[calc(100vh-70px)]">
          {title && (
            <div className="border-b border-[#E5E7EB] bg-white px-6 lg:px-8 py-6">
              <h1 className="text-3xl font-bold text-[#111827]">{title}</h1>
              {subtitle && (
                <p className="text-base text-[#6B7280] mt-2">{subtitle}</p>
              )}
            </div>
          )}
          <div className="p-6 lg:p-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

