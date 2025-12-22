import { useState, useEffect } from 'react';
import { Bell, User, LogOut, Settings, Menu, X, RefreshCw, Circle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { notificationsApi } from '@/api';
import { NotificationModel } from '@/models';
import { format } from 'date-fns';

interface AdminTopNavProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

// Menu items matching AdminSidebar
const menuItems = [
  { title: 'Dashboard', path: '/admin' },
  { title: 'Found Pets', path: '/admin/found-pets' },
  { title: 'Lost Pets', path: '/admin/lost-pets' },
  { title: 'Adoption', path: '/admin/adopt' },
  { title: 'Chats', path: '/admin/chats' },
  { title: 'Users', path: '/admin/users' },
  { title: 'All Pets', path: '/admin/all-pets' },
  { title: 'Role Requests', path: '/admin/role-requests' },
  { title: 'Feeding Points', path: '/admin/feeding-points' },
  { title: 'Shelter Locations', path: '/admin/shelter-locations' },
  { title: 'Medical Registration', path: '/admin/medical-records' },
];

export function AdminTopNav({ onMenuToggle, sidebarOpen, onRefresh, isRefreshing = false }: AdminTopNavProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get current selected section
  const getCurrentSection = () => {
    const currentItem = menuItems.find(item => {
      if (item.path === '/admin') {
        return location.pathname === '/admin' || location.pathname === '/admin/';
      }
      return location.pathname.startsWith(item.path);
    });
    return currentItem?.title || 'Dashboard';
  };

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await notificationsApi.getAll();
        setNotifications(data.slice(0, 5));
        const count = await notificationsApi.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] w-full h-[70px] border-b border-[#E5E7EB] bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="flex h-[70px] items-center justify-between px-6 w-full max-w-[1400px] mx-auto">
        {/* Logo and Website Name */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex-shrink-0">
            <Logo 
              size="md" 
              showText={true} 
              showTagline={false}
              linkTo="/admin"
            />
          </div>
          <span className="hidden md:block text-base md:text-lg font-semibold text-gray-700 border-l border-gray-300 pl-4 md:pl-6 whitespace-nowrap">
            Admin Controls
          </span>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuToggle}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          {/* Live System Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] rounded-xl border border-[#10B981]/20 shadow-sm">
            <div className="relative">
              <Circle className="h-2.5 w-2.5 text-[hsl(var(--success))] fill-[hsl(var(--success))]" />
              <div className="absolute inset-0 animate-ping">
                <Circle className="h-2.5 w-2.5 text-[#10B981] fill-[#10B981] opacity-75" />
              </div>
            </div>
            <span className="text-xs font-semibold text-[hsl(var(--success))]">Live System</span>
          </div>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="hidden lg:flex gap-2 text-[#374151] hover:text-[#06B6D4] hover:bg-[#F0FDFA] rounded-xl disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="font-medium">
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-[#F3F4F6] h-10 w-10 transition-all">
                <Bell className="h-5 w-5 text-[#374151]" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#EF4444] rounded-full"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-xl border border-[#E5E7EB] shadow-xl">
              <DropdownMenuLabel className="flex items-center justify-between text-[#111827] font-semibold">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20 rounded-full">
                    {unreadCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#E5E7EB]" />
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[#6B7280]">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start p-4 cursor-pointer hover:bg-[#F9FAFB] rounded-lg transition-colors"
                      onClick={async () => {
                        if (!notification.is_read) {
                          await notificationsApi.markRead(notification.id);
                        }
                        if (notification.link_target) {
                          navigate(notification.link_target);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#111827]">
                            {notification.title}
                          </p>
                          <p className="text-xs text-[#6B7280] mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-[#9CA3AF] mt-1">
                            {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-[#06B6D4] ml-2 mt-1" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-[#E5E7EB]" />
                  <DropdownMenuItem
                    className="text-center justify-center text-[#06B6D4] font-semibold hover:text-[#0891B2] hover:bg-[#F0FDFA] cursor-pointer rounded-lg"
                    onClick={() => navigate('/admin/notifications')}
                  >
                    View More
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10 px-3 rounded-xl hover:bg-[#F3F4F6] transition-all">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#3B82F6] flex items-center justify-center border-2 border-white shadow-md">
                  <span className="text-sm font-semibold text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-[#111827]">{user?.name || 'Admin'}</p>
                  <Badge variant="secondary" className="text-xs bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20 rounded-full">
                    Admin
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border border-[#E5E7EB] shadow-xl">
              <DropdownMenuLabel className="text-[#111827] font-semibold">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#E5E7EB]" />
              <DropdownMenuItem onClick={() => navigate('/admin/profile')} className="rounded-lg hover:bg-[#F9FAFB]">
                <User className="mr-2 h-4 w-4 text-[#06B6D4]" />
                <span className="text-[#374151]">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin')} className="rounded-lg hover:bg-[#F9FAFB]">
                <Settings className="mr-2 h-4 w-4 text-[#06B6D4]" />
                <span className="text-[#374151]">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#E5E7EB]" />
              <DropdownMenuItem onClick={handleLogout} className="text-[#EF4444] rounded-lg hover:bg-[#FEE2E2]">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
