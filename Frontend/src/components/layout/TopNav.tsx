import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Search, Bell, User, LogOut, PawPrint, Home, ShieldCheck, Heart, Star, CheckCircle2, Trash2, MessageSquare, MapPin, Users, Sparkles, AlertCircle } from 'lucide-react';
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
import { notificationsAPI } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

export const TopNav = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      loadUnreadCount();
      // Refresh notifications every 30 seconds
      const interval = setInterval(() => {
        loadNotifications();
        loadUnreadCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.getAll();
      setNotifications(data.slice(0, 10)); // Show latest 10
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationsAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await notificationsAPI.delete(id);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const navigation = [
    { name: 'Found Pets', href: '/pets/found', icon: Heart },
    { name: 'Lost Pets', href: '/pets/lost', icon: Search },
    { name: 'Adopt', href: '/pets/adopt', icon: Users },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-green-100 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <PawPrint className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                PetReunite
              </span>
              <span className="text-xs text-gray-500 hidden sm:block">Helping pets find home</span>
            </div>
          </Link>

          {/* Desktop Navigation - Only for authenticated users */}
          {isAuthenticated && (
            <div className="hidden md:flex md:items-center md:gap-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className="group relative px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-700 transition-all duration-200 hover:text-green-600 hover:bg-green-50"
                  activeClassName="text-green-600 bg-green-50"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
                </NavLink>
              ))}
            </div>
          )}

          {/* Search & Actions */}
          <div className="flex items-center gap-3">

            {isAuthenticated ? (
              <>
                {/* Home Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className="hidden sm:flex items-center gap-2 text-gray-700 hover:text-green-600 hover:bg-green-50"
                >
                  <Link to="/home">
                    <Home className="h-4 w-4" />
                    <span className="hidden lg:inline">Home</span>
                  </Link>
                </Button>

                {/* Notifications */}
                <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      aria-label="Notifications"
                      className="relative text-gray-700 hover:text-green-600 hover:bg-green-50"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-5 w-5 bg-green-600 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0 max-h-[500px] overflow-y-auto">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between mb-2">
                        <DropdownMenuLabel className="p-0 text-base font-bold">Notifications</DropdownMenuLabel>
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-green-600 hover:text-green-700 h-auto py-1"
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
                              !notif.is_read ? 'bg-green-50/50' : ''
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
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
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
                      className="flex items-center gap-2 px-2 hover:bg-green-50 rounded-lg"
                      aria-label="User menu"
                    >
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-green-200">
                        <AvatarFallback className="bg-gradient-to-br from-green-600 to-emerald-600 text-white font-semibold">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:flex flex-col items-start">
                        <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
                        {isAdmin && (
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-200 px-1.5 py-0">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2">
                    <DropdownMenuLabel className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-green-200">
                          <AvatarFallback className="bg-gradient-to-br from-green-600 to-emerald-600 text-white font-semibold">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-semibold text-gray-900 truncate">{user?.name}</span>
                          <span className="text-xs text-gray-500 truncate">{user?.email}</span>
                          {isAdmin && (
                            <Badge className="mt-1 w-fit text-xs bg-green-100 text-green-700 border-green-200">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                      <Link to="/home" className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Home
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                      <Link to="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                      <Link to="/chats" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        My Chats
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link to="/admin" className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="cursor-pointer rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  asChild
                  className="text-gray-700 hover:text-green-600 hover:bg-green-50"
                >
                  <Link to="/auth/login">Login</Link>
                </Button>
                <Button 
                  asChild
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                >
                  <Link to="/auth/register">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-700 hover:text-green-600 hover:bg-green-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu - Only for authenticated users */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t-2 border-green-100 bg-white shadow-lg">
          <div className="space-y-1 px-4 pb-4 pt-3">
            <Link
              to="/home"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="h-5 w-5" />
              Home
            </Link>
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                activeClassName="bg-green-50 text-green-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-200">
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-5 w-5" />
                My Profile
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
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
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-red-600 hover:bg-red-50 w-full text-left transition-colors"
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
