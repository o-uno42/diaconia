import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useAppContext } from './store/AppContext';
import { t } from './i18n/translations';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import AdminDashboard from './components/dashboard/AdminDashboard';
import AdminSidebar from './components/layout/AdminSidebar';
import RagazzoBottomNav from './components/layout/RagazzoBottomNav';
import RagazziListPage from './components/profile/RagazziListPage';
import ProfilePage from './components/profile/ProfilePage';
import AdminProfilePage from './components/profile/AdminProfilePage';
import TaskCalendarPage from './components/tasks/TaskCalendarPage';
import RagazzoTaskView from './components/tasks/RagazzoTaskView';
import RagazzoWeeklyActivitiesView from './components/weekly/RagazzoWeeklyActivitiesView';
import ReportPage from './components/report/ReportPage';
import CommitmentsCalendarPage from './components/commitments/CommitmentsCalendarPage';
import WeeklyActivitiesPage from './components/weekly/WeeklyActivitiesPage';
import TaskStatsPage from './components/stats/TaskStatsPage';
import WashingMachinePage from './components/washingMachine/WashingMachinePage';
import landingImage from './assets/landing.png';

function GlobalAccessibilityPreferences() {
  const { state } = useAppContext();

  useEffect(() => {
    const root = document.documentElement;
    const scalePercent = state.currentUser?.role === 'ragazzo' ? state.textScalePercent : 100;
    root.style.setProperty('--app-text-scale', String(scalePercent / 100));
  }, [state.currentUser?.role, state.textScalePercent]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.highContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');
  }, [state.highContrast]);

  return null;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { state } = useAppContext();
  if (!state.currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminLayout() {
  return (
    <div className="h-screen overflow-hidden gradient-ragazzo">
      <AdminSidebar />
      <main className="ml-64 p-8 h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

function RagazzoLayout() {
  return (
    <div className="min-h-screen gradient-ragazzo">
      <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <Outlet />
      </main>
      <RagazzoBottomNav />
    </div>
  );
}

function RoleRouter() {
  const { state } = useAppContext();
  if (!state.currentUser) return <Navigate to="/login" replace />;
  if (state.currentUser.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/ragazzo" replace />;
}

function RagazzoHome() {
  const { state } = useAppContext();
  const title = t('ragazzo_home_title', state.language);

  return (
    <div className="animate-fade-in min-h-[calc(100dvh-9rem)] flex flex-col items-center justify-center text-center gap-6">
      <h1 className="text-2xl font-bold text-stone-800">{title}</h1>
      <img
        src={landingImage}
        alt="Landing"
        className="w-full h-auto max-w-md mx-auto rounded-2xl"
      />
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <GlobalAccessibilityPreferences />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>}>
          <Route index element={<AdminDashboard />} />
          <Route path="ragazzi" element={<RagazziListPage />} />
          <Route path="ragazzi/:id" element={<ProfilePage />} />
          <Route path="ragazzi/:id/report" element={<ReportPage />} />
          <Route path="tasks" element={<TaskCalendarPage />} />
          <Route path="commitments" element={<CommitmentsCalendarPage />} />
          <Route path="weekly-activities" element={<WeeklyActivitiesPage />} />
          <Route path="stats" element={<TaskStatsPage />} />
          <Route path="washing-machine" element={<WashingMachinePage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>

        {/* Ragazzo routes */}
        <Route path="/ragazzo" element={<AuthGuard><RagazzoLayout /></AuthGuard>}>
          <Route index element={<RagazzoHome />} />
          <Route path="tasks" element={<RagazzoTaskView />} />
          <Route path="weekly-activities" element={<RagazzoWeeklyActivitiesView />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<RoleRouter />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

