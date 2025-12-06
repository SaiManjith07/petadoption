import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PawPrint,
  Search,
  Heart,
  MessageSquare,
  User,
  Building2,
  UtensilsCrossed,
  FileText,
  Settings,
  Home,
  Chat,
  MapPin,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';

interface UserSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  {
    title: 'Home',
    icon: LayoutDashboard,
    path: '/home',
    description: 'Overview & stats',
  },
  {
    title: 'Found Pets',
    icon: PawPrint,
    path: '/pets/found',
    description: 'Browse found pets',
  },
  {
    title: 'Lost Pets',
    icon: Search,
    path: '/pets/lost',
    description: 'Help find lost pets',
  },
  {
    title: 'Adoption',
    icon: Heart,
    path: '/pets/adopt',
    description: 'Adopt a pet',
  },
  {
    title: 'Messages',
    icon: MessageSquare,
    path: '/chats',
    description: 'Chat with users',
  },
  {
    title: 'Feeding Points',
    icon: UtensilsCrossed,
    path: '/feeding-points',
    description: 'Community feeding',
  },
  {
    title: 'Shelters',
    icon: Building2,
    path: '/shelter-capacity',
    description: 'Find shelters',
  },
  {
    title: 'Health & Vaccination',
    icon: Stethoscope,
    path: '/health-vaccination',
    description: 'Pet health services',
  },
];

export function UserSidebar({ isOpen = true, onClose }: UserSidebarProps) {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-72 bg-gradient-to-b from-white via-gray-50/50 to-white border-r border-gray-200/80 shadow-xl transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="flex h-20 items-center border-b border-gray-200/80 px-6 bg-gradient-to-r from-[#2BB6AF]/5 to-transparent">
            <Link to="/home" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2BB6AF] to-[#4CAF50] rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2BB6AF] to-[#4CAF50] shadow-lg group-hover:scale-105 transition-transform">
                  <PawPrint className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-gray-900 group-hover:text-[#2BB6AF] transition-colors">
                  PetReunite
                </h1>
                <p className="text-xs text-gray-500 font-medium">User Dashboard</p>
              </div>
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path === '/home' && location.pathname === '/home') ||
                (item.path === '/chats' && location.pathname.startsWith('/chat')) ||
                (item.path === '/pets/found' && location.pathname === '/pets/found') ||
                (item.path === '/pets/lost' && location.pathname === '/pets/lost') ||
                (item.path === '/pets/adopt' && location.pathname === '/pets/adopt') ||
                (item.path === '/health-vaccination' && location.pathname === '/health-vaccination');

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024 && onClose) {
                      onClose();
                    }
                  }}
                  className={cn(
                    'group flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'bg-gradient-to-r from-[#2BB6AF]/10 to-[#4CAF50]/5 text-[#2BB6AF] shadow-sm border border-[#2BB6AF]/20'
                      : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 hover:shadow-sm'
                  )}
                >
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg transition-all',
                    isActive
                      ? 'bg-gradient-to-br from-[#2BB6AF] to-[#4CAF50] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:text-[#2BB6AF]'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{item.title}</div>
                    <div className={cn(
                      'text-xs truncate',
                      isActive ? 'text-[#2BB6AF]/70' : 'text-gray-500'
                    )}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="absolute right-3 h-2 w-2 rounded-full bg-[#4CAF50] animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Admin Link */}
          {isAdmin && (
            <div className="px-4 pb-2">
              <Link
                to="/admin"
                className="flex items-center gap-3 rounded-xl px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/50 hover:from-purple-100 hover:to-indigo-100 transition-all group"
                onClick={() => {
                  if (window.innerWidth < 1024 && onClose) {
                    onClose();
                  }
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md group-hover:scale-105 transition-transform">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">Admin Panel</div>
                  <div className="text-xs text-gray-600">Manage system</div>
                </div>
              </Link>
            </div>
          )}

          {/* User Info Footer */}
          <div className="border-t border-gray-200/80 p-4 bg-gradient-to-r from-gray-50/50 to-transparent">
            <Link
              to="/profile"
              className="flex items-center gap-3 rounded-xl p-3 hover:bg-gray-100/80 transition-colors group"
              onClick={() => {
                if (window.innerWidth < 1024 && onClose) {
                  onClose();
                }
              }}
            >
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2BB6AF] to-[#4CAF50] text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'user@example.com'}
                </p>
                {user?.role && user.role !== 'user' && (
                  <Badge className="mt-1 text-xs bg-[#2BB6AF]/10 text-[#2BB6AF] border-[#2BB6AF]/20 capitalize">
                    {user.role}
                  </Badge>
                )}
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

