import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useAppContext } from './store/AppContext';
import LoginPage from './components/auth/LoginPage';
import AdminDashboard from './components/dashboard/AdminDashboard';
import AdminSidebar from './components/layout/AdminSidebar';
import RagazzoBottomNav from './components/layout/RagazzoBottomNav';
import RagazziListPage from './components/profile/RagazziListPage';
import ProfilePage from './components/profile/ProfilePage';
import TaskCalendarPage from './components/tasks/TaskCalendarPage';
import RagazzoTaskView from './components/tasks/RagazzoTaskView';
import ReportPage from './components/report/ReportPage';
import CommitmentsCalendarPage from './components/commitments/CommitmentsCalendarPage';
import { isMockMode } from './lib/supabase';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { state } = useAppContext();
  if (!state.currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminLayout() {
  return (
    <div className="min-h-screen gradient-admin">
      <AdminSidebar />
      <main className="ml-64 p-8 min-h-screen">
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
  const ragazzo = state.currentUser;
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-2">Ciao! 👋</h1>
      <p className="text-white/50 mb-6">Benvenuto nella tua area personale</p>
      <div className="space-y-4">
        <div className="glass-card p-5">
          <p className="text-sm text-white/50">Il tuo ruolo</p>
          <p className="text-lg font-semibold text-ragazzo-400 mt-1">Ragazzo</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-white/50">Email</p>
          <p className="text-lg text-white mt-1">{ragazzo?.email}</p>
        </div>
      </div>
      {isMockMode && (
        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          🔧 Modalità demo — nessun backend collegato
        </div>
      )}
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="ragazzi" element={<RagazziListPage />} />
        <Route path="ragazzi/:id" element={<ProfilePage />} />
        <Route path="ragazzi/:id/report" element={<ReportPage />} />
        <Route path="tasks" element={<TaskCalendarPage />} />
        <Route path="commitments" element={<CommitmentsCalendarPage />} />
      </Route>

      {/* Ragazzo routes */}
      <Route path="/ragazzo" element={<AuthGuard><RagazzoLayout /></AuthGuard>}>
        <Route index element={<RagazzoHome />} />
        <Route path="tasks" element={<RagazzoTaskView />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<RoleRouter />} />
    </Routes>
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
