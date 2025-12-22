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
  ArrowRight,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
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

      {/* Sidebar - Modern floating design with 260px width */}
      <aside
        className={cn(
          'fixed left-0 top-[70px] z-[999] h-[calc(100vh-70px)] w-[260px] bg-[#F8FAFB] border-r border-[#E5E7EB]',
          'transition-all duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1 px-3 py-4 sm:py-6 overflow-y-auto scrollbar-hide">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path === '/home' && location.pathname === '/home') ||
                (item.path === '/chats' && location.pathname.startsWith('/chat')) ||
                (item.path === '/pets/found' && location.pathname.startsWith('/pets/found')) ||
                (item.path === '/pets/lost' && location.pathname.startsWith('/pets/lost')) ||
                (item.path === '/pets/adopt' && location.pathname.startsWith('/pets/adopt')) ||
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
                    'group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 relative cursor-pointer',
                    isActive
                      ? 'bg-[#2DD4BF] text-white shadow-sm'
                      : 'text-[#1F2937] hover:bg-[#E0F2F1] hover:text-[#2DD4BF]'
                  )}
                  style={!isActive ? { transform: 'scale(1)' } : {}}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-3 w-1 h-8 bg-[#14B8A6] rounded-r-full" />
                  )}
                  <Icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-white' : 'text-[#6B7280] group-hover:text-[#2DD4BF]')} strokeWidth={2} />
                  <div className="flex-1 min-w-0">
                    <div className={cn('font-semibold text-sm', isActive ? 'text-white' : 'text-[#1F2937]')}>{item.title}</div>
                    <div className={cn(
                      'text-xs truncate mt-0.5',
                      isActive ? 'text-white/90' : 'text-[#6B7280]'
                    )}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <ArrowRight className="h-4 w-4 text-white flex-shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Admin Link */}
          {isAdmin && (
            <div className="px-3 pb-2">
              <Link
                to="/admin"
                className="flex items-center gap-3 rounded-xl px-4 py-3 bg-gradient-to-r from-[#8B5CF6]/10 to-[#EC4899]/10 border border-[#8B5CF6]/20 hover:from-[#8B5CF6]/20 hover:to-[#EC4899]/20 transition-all group shadow-sm"
                onClick={() => {
                  if (window.innerWidth < 1024 && onClose) {
                    onClose();
                  }
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] text-white shadow-md group-hover:scale-105 transition-transform">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#111827]">Admin Panel</div>
                  <div className="text-xs text-[#6B7280]">Manage system</div>
                </div>
              </Link>
            </div>
          )}

          {/* User Info Footer */}
          <div className="border-t border-[#E5E7EB] p-4 bg-[#F8FAFB]">
            <Link
              to="/profile"
              className="flex items-center gap-3 rounded-lg p-3 hover:bg-white transition-all duration-300 group shadow-sm border border-[#E5E7EB]"
              onClick={() => {
                if (window.innerWidth < 1024 && onClose) {
                  onClose();
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#2DD4BF] to-[#14B8A6] text-white font-bold text-base shadow-md group-hover:scale-105 transition-transform duration-300">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#10B981] border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1F2937] truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-[#6B7280] truncate">
                  {user?.email || 'user@example.com'}
                </p>
                {user?.role && user.role !== 'user' && (
                  <Badge className="mt-1.5 text-xs bg-[#2DD4BF]/10 text-[#2DD4BF] border-[#2DD4BF]/20 capitalize rounded-full px-2 py-0.5">
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

