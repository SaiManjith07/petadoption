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
    <div className="min-h-screen bg-white">
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

      {/* Main Content */}
      <div className="flex flex-col min-w-0 lg:ml-72 pt-16">
        <main className="flex-1 overflow-y-auto bg-white">
          {title && (
            <div className="border-b bg-white px-6 py-4">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          )}
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

