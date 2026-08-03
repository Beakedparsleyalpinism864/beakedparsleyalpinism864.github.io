import React, { useState, useEffect } from 'react';
import { UserProfile, ActiveTab, AppNotification } from '../types';
import { Sparkles, Search, LogIn, LogOut, User, Settings, Compass, MessageSquare, Sticker, Bell, CheckCheck } from 'lucide-react';
import { getUserNotificationsRealtime, markNotificationAsRead, markAllNotificationsAsRead } from '../services/dbService';

interface HeaderProps {
  currentUser: UserProfile | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onGoogleSignIn,
  onSignOut,
  activeTab,
  setActiveTab,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const unsub = getUserNotificationsRealtime(currentUser.uid, (list) => {
      setNotifications(list);
    });

    return () => unsub();
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotifClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }
    setIsNotifOpen(false);

    if (notif.type === 'message') {
      setActiveTab('chats');
    } else {
      setActiveTab('feed');
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markAllNotificationsAsRead(currentUser.uid, unreadIds);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('feed')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-white/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center">
            <span className="text-xl font-black tracking-tight text-[#111111]">
              FurHub<span className="text-sky-600">UA</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-black px-2.5 py-0.5 bg-sky-500 text-white rounded-full shadow-xs">
              UA Furry
            </span>
          </div>
        </div>

        {/* Quick Search Shortcut Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <button
            onClick={() => setActiveTab('search')}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-100 text-[#111111] hover:bg-slate-200 transition-colors text-sm text-left border border-slate-200 cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#111111] shrink-0" />
            <span className="text-[#111111] font-extrabold">Пошук акаунтів, постів та груп...</span>
          </button>
        </div>

        {/* Auth Actions & Profile Chip */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 text-[#111111] hover:text-sky-600 hover:bg-slate-100 rounded-xl transition-colors relative cursor-pointer border border-slate-200 bg-white"
                  title="Сповіщення"
                >
                  <Bell className="w-5 h-5 text-[#111111]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-sky-600" />
                        <span className="text-xs font-black text-[#111111] uppercase tracking-wider">
                          Сповіщення
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-sky-500 text-white rounded-full">
                            {unreadCount} нових
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-bold text-sky-600 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Прочитати все</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#111111] font-medium">
                          Поки що немає сповіщень. Лайки, коментарі та повідомлення з'являться тут! ✨
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 ${
                              !notif.isRead ? 'bg-sky-50' : ''
                            }`}
                          >
                            <img
                              src={notif.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt={notif.senderName}
                              className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-sky-500/60 mt-0.5"
                            />
                            <div className="flex-1 min-w-0 text-xs">
                              <div className="text-[#111111] font-extrabold leading-tight">
                                {notif.senderName}{' '}
                                <span className="font-bold text-[#111111]">
                                  {notif.text}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-600 mt-1 font-semibold">
                                {formatDate(notif.createdAt)}
                              </div>
                            </div>
                            {!notif.isRead && (
                              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0 mt-2 shadow-sm" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Chip */}
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500/80"
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-black text-[#111111] leading-tight">
                    {currentUser.displayName}
                  </span>
                  <span className="text-[10px] text-sky-700 font-extrabold leading-tight">
                    @{currentUser.username}
                  </span>
                </div>
              </button>

              <button
                onClick={onSignOut}
                title="Вийти з акаунта"
                className="p-2 text-[#111111] hover:text-red-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200 bg-white"
              >
                <LogOut className="w-5 h-5 text-[#111111] hover:text-red-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-md transition-colors text-sm border border-white/10 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-white" />
              <span>Увійти через Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

