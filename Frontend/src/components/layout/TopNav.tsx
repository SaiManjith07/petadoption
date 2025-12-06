import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Search, Bell, User, LogOut, PawPrint, Home, ShieldCheck, Heart, Star, CheckCircle2, Trash2, MessageSquare, MapPin, Users, Sparkles, AlertCircle, Building2, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { NavLink } from '@/components/NavLink';
import { Badge } from '@/components/ui/badge';
import { notificationsApi } from '@/api';
import { formatDistanceToNow } from 'date-fns';

export const TopNav = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isHomePage = location.pathname === '/home';
  const isAdminPage = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      loadUnreadCount();
      // Increase interval to 60 seconds to reduce API calls
      const interval = setInterval(() => {
        loadNotifications();
        loadUnreadCount();
      }, 60000); // Changed from 30s to 60s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data.slice(0, 10));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: number | string) => {
    try {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      await notificationsApi.markRead(numId);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (id: number | string) => {
    try {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      await notificationsApi.delete(numId);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const navigation = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Found Pets', href: '/pets/found', icon: Heart },
    { name: 'Lost Pets', href: '/pets/lost', icon: Search },
    { name: 'Adopt', href: '/pets/adopt', icon: Users },
    { name: 'Shelter', href: '/shelter-capacity', icon: Building2 },
    { name: 'Feedpoint', href: '/feeding-points', icon: UtensilsCrossed },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={isAuthenticated ? "/home" : "/"} className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2BB6AF] to-[#4CAF50] rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-[#2BB6AF] to-[#4CAF50] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <PawPrint className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 group-hover:text-[#2BB6AF] transition-colors">PetReunite</span>
              <span className="text-xs text-gray-500 hidden sm:block font-medium">Helping pets find home</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && !isAdminPage && (
            <div className="hidden md:flex md:items-center md:gap-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className="group relative px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 transition-all duration-200 hover:text-[#2BB6AF] hover:bg-gradient-to-r hover:from-[#2BB6AF]/10 hover:to-[#4CAF50]/5 hover:shadow-sm"
                  activeClassName="text-[#2BB6AF] bg-gradient-to-r from-[#2BB6AF]/10 to-[#4CAF50]/5 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                </NavLink>
              ))}
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="relative text-gray-600 hover:text-[#2BB6AF] hover:bg-gradient-to-r hover:from-[#2BB6AF]/10 hover:to-[#4CAF50]/5 rounded-xl transition-all"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-5 w-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-lg animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0 max-h-[500px] overflow-y-auto">
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between">
                        <DropdownMenuLabel className="p-0 text-base font-semibold">Notifications</DropdownMenuLabel>
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-[#4CAF50] hover:text-[#2E7D32] h-auto py-1"
                          >
                            Mark all read
                          </Button>
                        )}
                      </div>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id || notif._id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                              !notif.is_read ? 'bg-[#4CAF50]/5' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notif.is_read ? 'font-semibold' : 'font-normal'} text-gray-900`}>
                                  {notif.message || notif.title || 'New notification'}
                                </p>
                                {notif.created_at && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {!notif.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleMarkAsRead(notif.id || notif._id)}
                                  >
                                    <CheckCircle2 className="h-4 w-4 text-[#4CAF50]" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleDeleteNotification(notif.id || notif._id)}
                                >
                                  <Trash2 className="h-4 w-4 text-gray-400" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-2 px-3 hover:bg-gradient-to-r hover:from-[#2BB6AF]/10 hover:to-[#4CAF50]/5 rounded-xl transition-all"
                    >
                      <Avatar className="h-10 w-10 border-2 border-[#2BB6AF]/30 shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-[#2BB6AF] to-[#4CAF50] text-white font-semibold text-sm">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:flex flex-col items-start">
                        <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
                        {isAdmin && (
                          <Badge className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200 px-1.5 py-0 mt-0.5">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-[#4CAF50]/20">
                          <AvatarFallback className="bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] text-white font-semibold">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-semibold text-gray-900 truncate">{user?.name}</span>
                          <span className="text-xs text-gray-500 truncate">{user?.email}</span>
                          {isAdmin && (
                            <Badge className="mt-1 w-fit text-xs bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/profile" className="flex items-center gap-2 cursor-pointer">
                            <User className="h-4 w-4" />
                            Admin Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                            <ShieldCheck className="h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/home" className="flex items-center gap-2 cursor-pointer">
                            <Home className="h-4 w-4" />
                            Home
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                            <User className="h-4 w-4" />
                            My Profile
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Button 
                  asChild
                  className="bg-gradient-to-r from-[#2BB6AF] to-[#4CAF50] hover:from-[#239a94] hover:to-[#2E7D32] text-white font-semibold px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                >
                  <Link to="/auth/register">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-600 hover:text-[#2BB6AF] hover:bg-gradient-to-r hover:from-[#2BB6AF]/10 hover:to-[#4CAF50]/5 rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t border-gray-200/80 bg-white/95 backdrop-blur-md">
          <div className="space-y-1 px-4 pb-4 pt-3">
            {!isAdminPage && navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-[#2BB6AF]/10 hover:to-[#4CAF50]/5 hover:text-[#2BB6AF] transition-all"
                activeClassName="bg-gradient-to-r from-[#2BB6AF]/10 to-[#4CAF50]/5 text-[#2BB6AF]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-200/80">
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-[#2BB6AF]/10 hover:to-[#4CAF50]/5 hover:text-[#2BB6AF] transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-5 w-5" />
                My Profile
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-purple-100 hover:to-indigo-100 hover:text-purple-700 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShieldCheck className="h-5 w-5" />
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-red-600 hover:bg-red-50 w-full text-left transition-all"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
