import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../store/AppContext';
import { apiGet, apiPatch } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { MOCK_NOTIFICATIONS } from '../../lib/mockData';
import type { Notification } from '@shared/types';
import { t } from '../../i18n/translations';

export default function NotificationBell() {
  const { state, dispatch } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const lang = state.language;

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (isMockMode) {
      dispatch({ type: 'SET_NOTIFICATIONS', payload: MOCK_NOTIFICATIONS });
      return;
    }
    const res = await apiGet<Notification[]>('/api/notifications');
    if (res.data) dispatch({ type: 'SET_NOTIFICATIONS', payload: res.data });
  }, [dispatch]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!isMockMode) await apiPatch('/api/notifications/read-all');
    dispatch({ type: 'MARK_NOTIFICATIONS_READ' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 glass-card z-50 animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="font-semibold text-white text-sm">{t('notif_title', lang)}</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-accent-400 hover:text-accent-300">
                  {t('notif_mark_all', lang)}
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {state.notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-white/40 text-sm">{t('notif_empty', lang)}</p>
              ) : (
                state.notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-white/5 ${n.read ? 'opacity-50' : ''}`}>
                    <p className="text-sm text-white/80">{n.message}</p>
                    <p className="text-xs text-white/30 mt-1">
                      {new Date(n.createdAt).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
