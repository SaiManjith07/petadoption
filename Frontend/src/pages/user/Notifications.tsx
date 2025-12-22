import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, CheckCircle2, Trash2, Check, ArrowLeft, 
  PawPrint, Search, Heart, MessageSquare, ShieldCheck, 
  AlertCircle, ChevronRight, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notificationsApi } from '@/api';
import { formatDistanceToNow, format } from 'date-fns';
import { NotificationSkeleton } from '@/components/ui/skeletons';

interface Notification {
  id: number | string;
  _id?: string;
  title?: string;
  message?: string;
  is_read: boolean;
  created_at: string;
  notification_type?: string;
  link_target?: string;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getAll();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number | string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      await notificationsApi.markRead(numId);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id: number | string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      await notificationsApi.delete(numId);
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Get notification type info for styling and navigation
  const getNotificationInfo = (notif: Notification) => {
    const message = (notif.message || notif.title || '').toLowerCase();
    const type = notif.notification_type?.toLowerCase() || '';
    
    // Found pet notifications
    if (message.includes('found') || type.includes('found')) {
      return {
        icon: PawPrint,
        color: 'bg-emerald-100 text-emerald-600',
        borderColor: 'border-l-emerald-500',
        bgColor: 'bg-emerald-50',
        badge: 'Found',
        badgeColor: 'bg-emerald-500',
        link: notif.link_target || '/pets/found'
      };
    }
    
    // Lost pet notifications
    if (message.includes('lost') || type.includes('lost')) {
      return {
        icon: Search,
        color: 'bg-orange-100 text-orange-600',
        borderColor: 'border-l-orange-500',
        bgColor: 'bg-orange-50',
        badge: 'Lost',
        badgeColor: 'bg-orange-500',
        link: notif.link_target || '/pets/lost'
      };
    }
    
    // Chat/message notifications
    if (message.includes('chat') || message.includes('message') || type.includes('chat')) {
      return {
        icon: MessageSquare,
        color: 'bg-blue-100 text-blue-600',
        borderColor: 'border-l-blue-500',
        bgColor: 'bg-blue-50',
        badge: 'Chat',
        badgeColor: 'bg-blue-500',
        link: notif.link_target || '/chats'
      };
    }
    
    // Adoption notifications
    if (message.includes('adopt') || type.includes('adopt')) {
      return {
        icon: Heart,
        color: 'bg-pink-100 text-pink-600',
        borderColor: 'border-l-pink-500',
        bgColor: 'bg-pink-50',
        badge: 'Adoption',
        badgeColor: 'bg-pink-500',
        link: notif.link_target || '/pets/adopt'
      };
    }
    
    // Approval/verified notifications
    if (message.includes('approved') || message.includes('verified') || type.includes('approved')) {
      return {
        icon: ShieldCheck,
        color: 'bg-green-100 text-green-600',
        borderColor: 'border-l-green-500',
        bgColor: 'bg-green-50',
        badge: 'Approved',
        badgeColor: 'bg-green-500',
        link: notif.link_target || '/home'
      };
    }
    
    // Default
    return {
      icon: Bell,
      color: 'bg-gray-100 text-gray-600',
      borderColor: 'border-l-[#2BB6AF]',
      bgColor: 'bg-[#2BB6AF]/5',
      badge: 'Update',
      badgeColor: 'bg-[#2BB6AF]',
      link: notif.link_target || '/home'
    };
  };

  const handleNotificationClick = async (notif: Notification) => {
    // Mark as read first
    if (!notif.is_read) {
      await handleMarkAsRead(notif.id || notif._id!);
    }
    
    // Navigate to corresponding page
    const info = getNotificationInfo(notif);
    navigate(info.link);
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'read') return notif.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#2BB6AF]/5 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/home')}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-xl border-0 overflow-hidden">
          {/* Header */}
          <CardHeader className="border-b bg-gradient-to-r from-[#2BB6AF]/10 via-[#2BB6AF]/5 to-transparent pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#2BB6AF] to-[#239a94] flex items-center justify-center shadow-lg">
                  <Bell className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Notifications</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Stay updated with your pet activities</p>
                </div>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-semibold">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-[#2BB6AF] border-[#2BB6AF] hover:bg-[#2BB6AF] hover:text-white transition-colors"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              )}
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 mt-6">
              {(['all', 'unread', 'read'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={`px-4 ${
                    filter === f 
                      ? 'bg-[#2BB6AF] hover:bg-[#239a94] text-white shadow-md' 
                      : 'hover:border-[#2BB6AF] hover:text-[#2BB6AF]'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === 'unread' && unreadCount > 0 && (
                    <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6">
                <NotificationSkeleton count={5} />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-16 text-center">
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-10 w-10 text-gray-300" />
                </div>
                <p className="text-xl font-semibold text-gray-700">No notifications</p>
                <p className="text-sm text-gray-500 mt-2">
                  {filter === 'unread' ? "You're all caught up! 🎉" : 'No notifications to display'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notif) => {
                  const info = getNotificationInfo(notif);
                  const IconComponent = info.icon;
                  
                  return (
                    <div
                      key={notif.id || notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-5 transition-all duration-300 cursor-pointer group
                        hover:bg-gray-50 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5
                        ${!notif.is_read ? `${info.bgColor} border-l-4 ${info.borderColor}` : 'border-l-4 border-l-transparent'}
                      `}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`h-12 w-12 rounded-xl ${info.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-base ${!notif.is_read ? 'font-semibold' : 'font-medium'} text-gray-900 line-clamp-2`}>
                              {notif.title || notif.message || 'New notification'}
                            </p>
                            <Badge className={`${info.badgeColor} text-white text-xs px-2 py-0.5 flex-shrink-0`}>
                              {info.badge}
                            </Badge>
                          </div>
                          
                          {notif.message && notif.title && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {notif.message}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span>{format(new Date(notif.created_at), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notif.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleMarkAsRead(notif.id || notif._id!, e)}
                              className="text-[#2BB6AF] hover:text-[#239a94] hover:bg-[#2BB6AF]/10 h-8 px-2"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDelete(notif.id || notif._id!, e)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 px-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#2BB6AF] group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
