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
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6 w-full">
        {/* Logo and Website Name */}
        <div className="flex items-center gap-3">
          <Logo 
            size="md" 
            showText={true} 
            showTagline={false}
            linkTo="/admin"
          />
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
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#E8F8EE] rounded-lg border border-[#2BB6AF]/20">
            <div className="relative">
              <Circle className="h-2 w-2 text-[#2BB6AF] fill-[#4CAF50]" />
              <div className="absolute inset-0 animate-ping">
                <Circle className="h-2 w-2 text-[#2BB6AF] fill-[#4CAF50] opacity-75" />
              </div>
            </div>
            <span className="text-xs font-medium text-[#2BB6AF]">Live System</span>
          </div>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="hidden lg:flex gap-2 text-gray-600 hover:text-[#2BB6AF] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#2BB6AF]"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs bg-[#E8F8EE] text-[#2BB6AF]">
                    {unreadCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start p-3 cursor-pointer hover:bg-gray-50"
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
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-[#2BB6AF] ml-2" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-center justify-center text-purple-600 font-medium hover:text-purple-700"
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
              <Button variant="ghost" className="flex items-center gap-2 h-10 px-3">
                <div className="h-8 w-8 rounded-full bg-[#E8F8EE] flex items-center justify-center border-2 border-[#2BB6AF]/20">
                  <span className="text-sm font-semibold text-[#2BB6AF]">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                  <Badge variant="secondary" className="text-xs bg-[#E8F8EE] text-[#2BB6AF] border-[#2BB6AF]/20">
                    Admin
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
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
