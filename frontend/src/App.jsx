import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages — Public
import Login    from './pages/Login';
import Register from './pages/Register';

// Pages — All roles
import VerifyPage      from './pages/VerifyPage';
import HistoryPage     from './pages/HistoryPage';
import FraudReportPage from './pages/FraudReportPage';

// Pages — Institution
import InstitutionDashboard from './pages/InstitutionDashboard';
import InstitutionCertificates from './pages/InstitutionCertificates';

// Pages — Admin
import AdminDashboard    from './pages/AdminDashboard';
import AdminInstitutions from './pages/AdminInstitutions';
import AdminLogs         from './pages/AdminLogs';
import { AdminUsers, AdminFraud } from './pages/AdminPages';

// ── Role guard ────────────────────────────────────────────────────────────────
function RoleRoute({ children, roles }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/verify" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#161628',
              color: '#e2e8f0',
              border: '1px solid #2a2a50',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#34d399', secondary: '#0f0f1e' } },
            error:   { iconTheme: { primary: '#fb7185', secondary: '#0f0f1e' } },
          }}
        />

        <Routes>
          {/* ── Public ── */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Protected (requires login) ── */}
          <Route element={<Layout />}>

            {/* All roles */}
            <Route path="/verify"       element={<VerifyPage />} />
            <Route path="/history"      element={<HistoryPage />} />
            <Route path="/fraud/report" element={<FraudReportPage />} />

            {/* Institution + Admin */}
            <Route path="/dashboard" element={
              <RoleRoute roles={['institution', 'admin']}>
                <InstitutionDashboard />
              </RoleRoute>
            } />
            <Route path="/certificates" element={
              <RoleRoute roles={['institution', 'admin']}>
                <InstitutionCertificates />
              </RoleRoute>
            } />

            {/* Admin only */}
            <Route path="/admin" element={
              <RoleRoute roles={['admin']}>
                <AdminDashboard />
              </RoleRoute>
            } />
            <Route path="/admin/users" element={
              <RoleRoute roles={['admin']}>
                <AdminUsers />
              </RoleRoute>
            } />
            <Route path="/admin/institutions" element={
              <RoleRoute roles={['admin']}>
                <AdminInstitutions />
              </RoleRoute>
            } />
            <Route path="/admin/fraud" element={
              <RoleRoute roles={['admin']}>
                <AdminFraud />
              </RoleRoute>
            } />
            <Route path="/admin/logs" element={
              <RoleRoute roles={['admin']}>
                <AdminLogs />
              </RoleRoute>
            } />

            {/* Fallbacks */}
            <Route path="/"  element={<Navigate to="/verify" replace />} />
            <Route path="*"  element={<Navigate to="/verify" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
