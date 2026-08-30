import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';

// Auth pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';

// Main pages
import DashboardPage from './pages/Dashboard/DashboardPage';
import CalendarPage from './pages/Calendar/CalendarPage';
import SchedulePage from './pages/Schedule/SchedulePage';
import ScheduleFormPage from './pages/Schedule/ScheduleFormPage';
import SubjectsPage from './pages/Subjects/SubjectsPage';
import LocationsPage from './pages/Locations/LocationsPage';
import AttendancePage from './pages/Attendance/AttendancePage';
import PaymentPage from './pages/Payment/PaymentPage';
import StatisticsPage from './pages/Statistics/StatisticsPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import SettingsPage from './pages/Settings/SettingsPage';

// Route guard
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

export default function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

      {/* Protected app routes */}
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="schedules" element={<SchedulePage />} />
        <Route path="schedules/new" element={<ScheduleFormPage />} />
        <Route path="schedules/:id/edit" element={<ScheduleFormPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="payments" element={<PaymentPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
