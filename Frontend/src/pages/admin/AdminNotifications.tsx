import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Trash2, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationsApi } from '@/api';
import { formatDistanceToNow } from 'date-fns';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopNav } from '@/components/layout/AdminTopNav';

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

const AdminNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleMarkAsRead = async (id: number | string) => {
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

  const handleDelete = async (id: number | string) => {
    try {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      await notificationsApi.delete(numId);
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'read') return notif.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72">
        <AdminTopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => navigate('/admin')}
              className="mb-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Admin Notifications</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">Manage all system notifications</p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-purple-600 border-purple-300 hover:bg-purple-50"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark all as read
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  {(['all', 'unread', 'read'] as const).map((f) => (
                    <Button
                      key={f}
                      variant={filter === f ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(f)}
                      className={filter === f ? 'bg-purple-600 hover:bg-purple-700' : ''}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
                    <p>Loading notifications...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm mt-1">
                      {filter === 'unread' ? "You're all caught up!" : 'No notifications to display'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredNotifications.map((notif) => (
                      <div
                        key={notif.id || notif._id}
                        className={`p-4 transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 ${
                          !notif.is_read ? 'bg-purple-50/50 border-l-4 border-l-purple-500 shadow-sm' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            {notif.title && (
                              <p className="text-sm font-semibold text-gray-900 mb-1">
                                {notif.title}
                              </p>
                            )}
                            <p
                              className={`text-base ${
                                !notif.is_read ? 'font-medium' : 'font-normal'
                              } text-gray-700`}
                            >
                              {notif.message || 'New notification'}
                            </p>
                            {notif.created_at && (
                              <p className="text-sm text-gray-500 mt-2">
                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!notif.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notif.id || notif._id!)}
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Mark read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notif.id || notif._id!)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminNotifications;

