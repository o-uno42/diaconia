import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppContext } from '../../store/AppContext';
import { t } from '../../i18n/translations';
import logo from '../../assets/logo.png';

const navItems = [
  { to: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', labelKey: 'nav_dashboard' as const },
  { to: '/admin/ragazzi', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z', labelKey: 'nav_ragazzi' as const },
  { to: '/admin/tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', labelKey: 'nav_tasks' as const },
  { to: '/admin/commitments', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', labelKey: 'nav_commitments' as const },
];

export default function AdminSidebar() {
  const { logout } = useAuth();
  const { state } = useAppContext();
  const lang = state.language;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white/55 backdrop-blur-md border-r border-stone-200/70 z-40 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-stone-200/70">
        <div className="flex items-center gap-3">
          <div className="text-center mt-3 mb-2 animate-slide-up">
            <img src={logo} alt="Diaconia" className="w-20 h-10 mx-auto mb-2 object-contain" />
            <h1 className="text-lg font-bold text-stone-800">Diaconia</h1>
            <p className="text-xs text-stone-800/50">{t('brand_subtitle', lang)}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                  : 'text-stone-700/80 hover:text-stone-900 hover:bg-white/60'
              }`
            }
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            {t(item.labelKey, lang)}
          </NavLink>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="p-4 border-t border-stone-200/70">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-xs font-bold text-stone-800">A</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 truncate">{t('role_admin', lang)}</p>
            <p className="text-xs text-stone-800/40 truncate">{state.currentUser?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t('nav_logout', lang)}
        </button>
      </div>
    </aside>
  );
}
