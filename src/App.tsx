import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { SyncProvider } from './context/SyncContext.tsx';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout.tsx';
import { AdminLayout } from './components/layout/AdminLayout.tsx';

// Public Pages
import { HomePage } from './pages/public/HomePage.tsx';
import { ProjectsPage } from './pages/public/ProjectsPage.tsx';
import { ProjectDetailsPage } from './pages/public/ProjectDetailsPage.tsx';
import { AboutPage } from './pages/public/AboutPage.tsx';
import { ContactPage } from './pages/public/ContactPage.tsx';

// Admin Pages
import { LoginPage } from './pages/admin/LoginPage.tsx';
import { DashboardPage } from './pages/admin/DashboardPage.tsx';
import { WorkSchedulePage } from './pages/admin/WorkSchedulePage.tsx';
import { WorkActivityDefinitionsPage } from './pages/admin/WorkActivityDefinitionsPage.tsx';
import { ProjectsListPage } from './pages/admin/ProjectsListPage.tsx';
import { ProjectDetailPage } from './pages/admin/ProjectDetailPage.tsx';
import { SitesPage } from './pages/admin/SitesPage.tsx';
import { PaymentsPage } from './pages/admin/PaymentsPage.tsx';
import { ExpensesPage } from './pages/admin/ExpensesPage.tsx';
import { ReportsPage } from './pages/admin/ReportsPage.tsx';
import { WorkersPage } from './pages/admin/WorkersPage.tsx';
import { WorkLogsPage } from './pages/admin/WorkLogsPage.tsx';
import { WorkerPaymentsPage } from './pages/admin/WorkerPaymentsPage.tsx';
import { MaterialsPage } from './pages/admin/MaterialsPage.tsx';
import { MaterialPurchasesPage } from './pages/admin/MaterialPurchasesPage.tsx';
import { InventoryPage } from './pages/admin/InventoryPage.tsx';
import { VendorsPage } from './pages/admin/VendorsPage.tsx';
import { AuditLogsPage } from './pages/admin/AuditLogsPage.tsx';
import { NotificationsPage } from './pages/admin/NotificationsPage.tsx';
import { CompanySettingsPage } from './pages/admin/CompanySettingsPage.tsx';

// Protected Route Guard
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse mb-4">
          <span className="font-black text-xl">A</span>
        </div>
        <h2 className="text-white font-bold text-base tracking-tight">ARAMBH ERP</h2>
        <p className="text-slate-400 text-xs mt-1">Initializing secure enterprise session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Portal Routes */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
          <Route
            path="/projects"
            element={
              <PublicLayout>
                <ProjectsPage />
              </PublicLayout>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <PublicLayout>
                <ProjectDetailsPage />
              </PublicLayout>
            }
          />
          <Route
            path="/about"
            element={
              <PublicLayout>
                <AboutPage />
              </PublicLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <PublicLayout>
                <ContactPage />
              </PublicLayout>
            }
          />

          {/* Admin Authentication */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Admin Protected ERP Cockpit */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/work-schedules"
            element={
              <ProtectedRoute>
                <WorkSchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activity-definitions"
            element={
              <ProtectedRoute>
                <WorkActivityDefinitionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute>
                <ProjectsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sites"
            element={
              <ProtectedRoute>
                <SitesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/client-payments"
            element={
              <ProtectedRoute>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/expenses"
            element={
              <ProtectedRoute>
                <ExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/workers"
            element={
              <ProtectedRoute>
                <WorkersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/work-logs"
            element={
              <ProtectedRoute>
                <WorkLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/worker-payments"
            element={
              <ProtectedRoute>
                <WorkerPaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/materials"
            element={
              <ProtectedRoute>
                <MaterialsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/material-purchases"
            element={
              <ProtectedRoute>
                <MaterialPurchasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vendors"
            element={
              <ProtectedRoute>
                <VendorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vendor-payments"
            element={
              <ProtectedRoute>
                <VendorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <CompanySettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SyncProvider>
  </AuthProvider>
  );
}
