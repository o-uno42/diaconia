import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { t } from '../../i18n/translations';

const navItems = [
  { to: '/ragazzo', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', labelKey: 'nav_home' as const },
  { to: '/ragazzo/tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', labelKey: 'nav_tasks' as const },
  { to: '/ragazzo/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', labelKey: 'nav_profile' as const },
];

export default function RagazzoBottomNav() {
  const { state } = useAppContext();
  const lang = state.language;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-admin-900/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/ragazzo'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px] ${
                isActive
                  ? 'text-ragazzo-400'
                  : 'text-white/40 hover:text-white/70'
              }`
            }
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            <span className="text-[10px] font-medium">{t(item.labelKey, lang)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
