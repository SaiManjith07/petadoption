import { useState, useEffect } from 'react';
import { Bell, User, LogOut, Menu, X, UserPlus, MapPin, AlertCircle } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '@/api';
import { NotificationModel } from '@/models';
import { format } from 'date-fns';

interface UserTopNavProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
  onRefresh?: () => void;
}

export function UserTopNav({ onMenuToggle, sidebarOpen, onRefresh }: UserTopNavProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const quickActions = [
    {
      title: 'Report Found Pet',
      description: 'Found a pet? Help reunite it with its family',
      icon: MapPin,
      href: '/pets/report-found',
    },
    {
      title: 'Report Lost Pet',
      description: 'Lost your pet? Get instant matches',
      icon: AlertCircle,
      href: '/pets/report-lost',
    },
    {
      title: 'Become Volunteer',
      description: 'Join us as a volunteer',
      icon: UserPlus,
      href: '/become-volunteer',
    },
  ];

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
    <header className="fixed top-0 left-0 right-0 z-40 w-full h-[70px] border-b border-[#E5E7EB] bg-white/95 backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="flex h-[70px] items-center justify-between px-6 w-full max-w-[1400px] mx-auto">
        {/* Logo and Website Name */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Logo
            size="md"
            showText={true}
            showTagline={false}
            linkTo="/home"
          />
        </div>

        {/* Center: Quick Actions */}
        <div className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="ghost"
              className="rounded-lg hover:bg-[#E0F2F1] h-10 px-4 text-sm font-medium text-[#1F2937] transition-all duration-200 hover:scale-105 hover:text-[#2DD4BF]"
              onClick={() => navigate(action.href)}
            >
              <action.icon className="h-4 w-4 mr-2 text-[#2DD4BF]" />
              <span>{action.title}</span>
            </Button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-lg hover:bg-[#E0F2F1] h-10 w-10 transition-all duration-200 hover:scale-105"
            onClick={onMenuToggle}
          >
            {sidebarOpen ? <X className="h-5 w-5 text-[#1F2937]" /> : <Menu className="h-5 w-5 text-[#1F2937]" />}
          </Button>
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-lg hover:bg-[#E0F2F1] h-10 w-10 transition-all duration-200 hover:scale-105">
                <Bell className="h-5 w-5 text-[#1F2937]" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#EF4444] text-white text-xs rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-xl border border-[#E5E7EB] shadow-xl">
              <DropdownMenuLabel className="text-[#111827] font-semibold">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#E5E7EB]" />
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#6B7280]">
                  No notifications
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start p-4 cursor-pointer hover:bg-[#F9FAFB] rounded-lg transition-colors"
                      onClick={() => {
                        if (!notification.is_read) {
                          notificationsApi.markRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between w-full">
                        <p className="text-sm font-semibold text-[#111827]">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-[#06B6D4] ml-2 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        {format(new Date(notification.created_at), 'MMM dd, h:mm a')}
                      </p>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
              <DropdownMenuSeparator className="bg-[#E5E7EB]" />
              <DropdownMenuItem
                className="text-center justify-center text-[#06B6D4] font-semibold hover:text-[#0891B2] hover:bg-[#F0FDFA] cursor-pointer rounded-lg"
                onClick={() => navigate('/notifications')}
              >
                View More
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10 px-2 rounded-lg hover:bg-[#E0F2F1] transition-all duration-200 hover:scale-105">
                <Avatar className="h-9 w-9 border-2 border-[#E5E7EB]">
                  <AvatarFallback className="bg-gradient-to-br from-[#2DD4BF] to-[#14B8A6] text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border border-[#E5E7EB] shadow-xl">
              <DropdownMenuLabel className="text-[#111827] font-semibold">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#E5E7EB]" />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg hover:bg-[#F9FAFB]">
                <User className="mr-2 h-4 w-4 text-[#06B6D4]" />
                <span className="text-[#374151]">Profile</span>
              </DropdownMenuItem>
              {!['rescuer', 'feeder', 'transporter'].includes(user?.role || '') && (
                <DropdownMenuItem onClick={() => navigate('/become-volunteer')} className="rounded-lg hover:bg-[#F9FAFB]">
                  <UserPlus className="mr-2 h-4 w-4 text-[#06B6D4]" />
                  <span className="text-[#374151]">Become Volunteer</span>
                </DropdownMenuItem>
              )}
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

