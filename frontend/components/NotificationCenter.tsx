import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, Check, X, Trash2, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

interface NotificationCenterProps {
  className?: string;
}

// Global notification state management
let notificationListeners: ((notifications: Notification[]) => void)[] = [];
let notifications: Notification[] = [];

export function addNotification(
  title: string,
  message: string,
  type: 'success' | 'info' | 'warning' | 'error' = 'info'
) {
  const notification: Notification = {
    id: `${Date.now()}-${Math.random()}`,
    title,
    message,
    type,
    timestamp: new Date(),
    read: false,
  };

  notifications = [notification, ...notifications];
  notifyListeners();
}

function notifyListeners() {
  notificationListeners.forEach(listener => listener([...notifications]));
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Subscribe to notification updates
    setLocalNotifications([...notifications]);
    
    const listener = (newNotifications: Notification[]) => {
      setLocalNotifications(newNotifications);
    };
    
    notificationListeners.push(listener);
    
    return () => {
      notificationListeners = notificationListeners.filter(l => l !== listener);
    };
  }, []);

  const unreadCount = localNotifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    notifications = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    notifyListeners();
  };

  const markAllAsRead = () => {
    notifications = notifications.map(n => ({ ...n, read: true }));
    notifyListeners();
  };

  const deleteNotification = (id: string) => {
    notifications = notifications.filter(n => n.id !== id);
    notifyListeners();
  };

  const clearAll = () => {
    notifications = [];
    notifyListeners();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-slate-100';
      case 'error':
        return 'text-red-600 bg-slate-100';
      case 'warning':
        return 'text-amber-600 bg-slate-100';
      default:
        return 'text-blue-600 bg-slate-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className}`}>
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-teal-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white" align="end">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
          <div>
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            <p className="text-xs text-slate-500">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          {localNotifications.length > 0 && (
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-7"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAll}
                className="h-7 w-7"
              >
                <Trash2 className="w-3 h-3 text-slate-400" />
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="h-[400px] bg-white">
          {localNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900 mb-1">No notifications</p>
              <p className="text-xs text-slate-500 text-center">
                You're all caught up! We'll notify you when something happens.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 bg-white">
              {localNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-slate-50 transition-colors bg-white ${
                    !notification.read ? 'bg-teal-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(
                        notification.type
                      )}`}
                    >
                      <span className="text-sm font-medium">
                        {getTypeIcon(notification.type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {format(notification.timestamp, 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6"
                            >
                              <Check className="w-3 h-3 text-slate-400" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6"
                          >
                            <X className="w-3 h-3 text-slate-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
