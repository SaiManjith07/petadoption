import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PawPrint,
  Calendar,
  Users,
  CreditCard,
  FileText,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarNewProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin',
    group: 'main',
  },
  {
    title: 'All Pets',
    icon: PawPrint,
    path: '/admin/pets',
    group: 'pets',
  },
  {
    title: 'Appointments',
    icon: Calendar,
    path: '/admin/appointments',
    group: 'main',
  },
  {
    title: 'Owners',
    icon: Users,
    path: '/admin/users',
    group: 'main',
  },
  {
    title: 'Payments',
    icon: CreditCard,
    path: '/admin/payments',
    group: 'main',
  },
  {
    title: 'Reports',
    icon: FileText,
    path: '/admin/reports',
    group: 'main',
  },
  {
    title: 'Settings',
    icon: Settings,
    path: '/admin/settings',
    group: 'main',
  },
];

export function AdminSidebarNew({ isOpen = true, onClose }: AdminSidebarNewProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50',
          'w-64 bg-white border-r border-gray-200',
          'flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'shadow-lg lg:shadow-none'
        )}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#2BB6AF] to-[#239a94] flex items-center justify-center">
              <PawPrint className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">PetReunite</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose?.();
                  }
                }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg',
                  'text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#2BB6AF]/10 text-[#239a94] border border-[#2BB6AF]/20'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'text-[#2E7D32]')} />
                <span className="pl-4">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

