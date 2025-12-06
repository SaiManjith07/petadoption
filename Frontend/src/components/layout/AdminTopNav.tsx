import { useState, useEffect } from 'react';
import { Search, Bell, User, LogOut, Settings, Menu, X, RefreshCw, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '@/api';
import { NotificationModel } from '@/models';
import { format } from 'date-fns';

interface AdminTopNavProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
  onRefresh?: () => void;
}

export function AdminTopNav({ onMenuToggle, sidebarOpen, onRefresh }: AdminTopNavProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

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
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2"
          onClick={onMenuToggle}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Left: Page Title */}
        <div className="hidden lg:block mr-8">
          <h2 className="text-lg font-bold text-gray-900">Admin Control Panel</h2>
          <p className="text-xs text-gray-500">Platform management & monitoring dashboard</p>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search pets, users, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#4CAF50] rounded-xl"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Live System Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#E8F8EE] rounded-lg border border-[#4CAF50]/20">
            <div className="relative">
              <Circle className="h-2 w-2 text-[#4CAF50] fill-[#4CAF50]" />
              <div className="absolute inset-0 animate-ping">
                <Circle className="h-2 w-2 text-[#4CAF50] fill-[#4CAF50] opacity-75" />
              </div>
            </div>
            <span className="text-xs font-medium text-[#4CAF50]">Live System</span>
          </div>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="hidden md:flex gap-2 text-gray-600 hover:text-[#4CAF50]"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden lg:inline">Refresh Data</span>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#4CAF50]"
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
                  <Badge variant="secondary" className="text-xs bg-[#E8F8EE] text-[#4CAF50]">
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
                          <div className="h-2 w-2 rounded-full bg-[#4CAF50] ml-2" />
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
                    className="text-center justify-center"
                    onClick={() => navigate('/notifications')}
                  >
                    View all notifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10 px-3">
                <div className="h-8 w-8 rounded-full bg-[#E8F8EE] flex items-center justify-center border-2 border-[#4CAF50]/20">
                  <span className="text-sm font-semibold text-[#4CAF50]">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                  <Badge variant="secondary" className="text-xs bg-[#E8F8EE] text-[#4CAF50] border-[#4CAF50]/20">
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
