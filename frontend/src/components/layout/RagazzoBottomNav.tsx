import { NavLink, useLocation } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { t } from '../../i18n/translations';

const navItems = [
  {
    to: '/ragazzo/tasks',
    end: false,
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    labelKey: 'nav_tasks' as const,
  },
  // {
  //   to: '/ragazzo',
  //   end: true,
  //   icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  //   labelKey: 'nav_home' as const,
  // },
  {
    to: '/ragazzo/profile',
    end: false,
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    labelKey: 'nav_profile' as const,
  },
];

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

export default function RagazzoBottomNav() {
  const { state } = useAppContext();
  const lang = state.language;
  const location = useLocation();

  const activeIndex = navItems.findIndex((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  );
  const hasActive = activeIndex >= 0;
  const indicatorLeft = `${((activeIndex + 0.5) / navItems.length) * 100}%`;
  const activeItem = hasActive ? navItems[activeIndex] : null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      aria-label="Bottom navigation"
    >
      <div className="relative w-full h-[calc(4rem+env(safe-area-inset-bottom))]">
        {/* Unified bar background */}
        <div className="nav-surface absolute inset-x-0 bottom-0 h-[calc(4rem+env(safe-area-inset-bottom))] bg-[#fef3c7]/10 rounded-3xl border border-stone-600 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl" />

        {/* Floating circular indicator — slides between slots, white halo blends
            with the bar to give the "the bar deforms to host the circle" feel */}
        {activeItem && (
          <div
            className="absolute top-0 will-change-transform"
            style={{
              left: indicatorLeft,
              transform: 'translate(-50%, -38%)',
              transition: `left 480ms ${EASE}`,
            }}
          >
            <div
              className="w-14 h-14 rounded-full gradient-sand text-stone-600 flex items-center justify-center
                         shadow-[0_0_0_1px_rgba(82,82,82,1.0)]"
            >
              <svg
                key={activeItem.to}
                className="w-6 h-6 animate-scale-in"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={activeItem.icon} />
              </svg>
            </div>
          </div>
        )}

        {/* Nav slots — all visually identical */}
        <div className="relative h-full flex items-stretch pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item, i) => {
            const isActive = i === activeIndex;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 select-none focus:outline-none"
                aria-label={t(item.labelKey, lang)}
              >
                <svg
                  className={`w-6 h-6 shrink-0 transition-all duration-300 ease-out ${
                    isActive
                      ? 'opacity-0 scale-50 -translate-y-2'
                      : 'opacity-100 text-stone-800 hover:text-stone-800'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span
                  className={`text-[10px] font-semibold tracking-wide transition-all duration-300 ${
                    isActive ? 'opacity-0 translate-y-1 text-indigo-600' : 'text-stone-800'
                  }`}
                >
                  {t(item.labelKey, lang)}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
