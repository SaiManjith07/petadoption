import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  PawPrint,
  Search,
  Home,
  MessageSquare,
  Users,
  FileText,
  Settings,
  BarChart3,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Building2,
  ClipboardCheck,
  Droplet,
  Bell,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin',
  },
  {
    title: 'Found Pets',
    icon: PawPrint,
    path: '/admin/found-pets',
  },
  {
    title: 'Lost Pets',
    icon: Search,
    path: '/admin/lost-pets',
  },
  {
    title: 'Adoption',
    icon: Home,
    path: '/admin/adopt',
  },
  {
    title: 'Manage Requests',
    icon: UserPlus,
    path: '/admin/requests',
  },
  {
    title: 'Chats',
    icon: MessageSquare,
    path: '/admin/chats',
  },
  {
    title: 'Users',
    icon: Users,
    path: '/admin/users',
  },
  {
    title: 'All Pets',
    icon: FileText,
    path: '/admin',
    hash: '#pets',
  },
  {
    title: 'Profile',
    icon: User,
    path: '/admin/profile',
  },
];

export const AdminSidebar = ({ isOpen = true, onClose }: AdminSidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string, hash?: string) => {
    if (hash) {
      return location.pathname === path && location.hash === hash;
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Fixed Sidebar */}
      <div className={cn(
        "w-64 bg-gradient-to-b from-[#4CAF50] to-[#4CAF50] text-white shadow-2xl",
        "lg:rounded-r-3xl lg:rounded-tl-3xl lg:border-r-2 lg:border-white/10 lg:shadow-[4px_0_20px_rgba(0,0,0,0.1)]",
        "relative overflow-hidden flex flex-col",
        // Desktop: fixed position, below navbar (navbar is h-16 = 4rem)
        "lg:fixed lg:left-0 lg:top-16 lg:h-[calc(100vh-4rem)] lg:z-40",
        // Mobile: fixed and slideable
        "fixed left-0 top-0 h-screen z-50 transform transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-tl-full blur-2xl pointer-events-none" />
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10 lg:rounded-tr-3xl">
        <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Pet Reunite</h1>
          <p className="text-xs text-white/70">Admin Panel</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="px-4 py-6 space-y-1 overflow-y-auto flex-1 min-h-0">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.hash);
          
          return (
            <Link
              key={item.path + (item.hash || '')}
              to={item.path + (item.hash || '')}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                active
                  ? 'bg-white text-[#2E7D32] shadow-lg border border-white/20'
                  : 'text-white/80 hover:bg-white/10 hover:text-white hover:rounded-xl'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-[#2E7D32]')} strokeWidth={2} />
              <span className="font-medium text-sm">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#1B5E20]/50 lg:rounded-br-3xl backdrop-blur-sm">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center border border-white/20 shadow-md">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-white/70 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

