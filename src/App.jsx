import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';

// Lazy loading pour optimiser performance
const LoginPage = lazy(() => import('./modules/auth/LoginPage'));
const DashboardPage = lazy(() => import('./modules/dashboard/DashboardPage'));
const DailyEntryPage = lazy(() => import('./modules/daily-entry/DailyEntryPage'));
const WeeklyReportPage = lazy(() => import('./modules/weekly-report/WeeklyReportPage'));
const ValidationPage = lazy(() => import('./modules/validation/ValidationPage'));
const HistoryPage = lazy(() => import('./modules/history/HistoryPage'));
const StatisticsPage = lazy(() => import('./modules/statistics/StatisticsPage'));
const SettingsPage = lazy(() => import('./modules/settings/SettingsPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-slate-600 text-sm font-medium">Chargement...</p>
    </div>
  </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="saisie" element={<DailyEntryPage />} />
              <Route path="rapports" element={<WeeklyReportPage />} />
              <Route path="validation" element={<ValidationPage />} />
              <Route path="historique" element={<HistoryPage />} />
              <Route path="statistiques" element={<StatisticsPage />} />
              <Route path="parametres" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
