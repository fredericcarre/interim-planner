import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/common';

// Auth pages
import {
  LoginPage,
  SignupPage,
  ForgotPasswordPage,
  ProtectedRoute,
} from '@/features/auth';

// Main pages
import {
  MonthView,
  WorkEntryForm,
  ExportPage,
  ComparePage,
} from '@/features/entries';

import {
  EstablishmentsList,
  EstablishmentForm,
} from '@/features/establishments';

import { SettingsPage } from '@/features/settings';

import { DataPrivacyPage, PrivacyPolicyPage } from '@/features/privacy';

import { SharePage, SharedViewPage, SharedPlanningsPage, InvitationPage } from '@/features/share';

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (isAuthenticated) {
    const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}

export function Router() {
  return (
    <BrowserRouter basename="/interim-planner">
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />

        {/* Privacy policy is accessible without login */}
        <Route path="/privacy/policy" element={<PrivacyPolicyPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MonthView />
            </ProtectedRoute>
          }
        />

        {/* Entries */}
        <Route
          path="/entries/new"
          element={
            <ProtectedRoute>
              <WorkEntryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entries/:id"
          element={
            <ProtectedRoute>
              <WorkEntryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/export/:month"
          element={
            <ProtectedRoute>
              <ExportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compare/:month"
          element={
            <ProtectedRoute>
              <ComparePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sharing"
          element={
            <ProtectedRoute>
              <SharePage />
            </ProtectedRoute>
          }
        />
        <Route path="/share/:month" element={<Navigate to="/sharing" replace />} />
        <Route path="/invitation/:token" element={<ProtectedRoute><InvitationPage /></ProtectedRoute>} />
        <Route path="/shared-plannings" element={<ProtectedRoute><SharedPlanningsPage /></ProtectedRoute>} />
        <Route path="/shared-plannings/:ownerId" element={<ProtectedRoute><SharedViewPage /></ProtectedRoute>} />

        {/* Establishments */}
        <Route
          path="/establishments"
          element={
            <ProtectedRoute>
              <EstablishmentsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/establishments/new"
          element={
            <ProtectedRoute>
              <EstablishmentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/establishments/:id"
          element={
            <ProtectedRoute>
              <EstablishmentForm />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Privacy */}
        <Route
          path="/privacy"
          element={
            <ProtectedRoute>
              <DataPrivacyPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
