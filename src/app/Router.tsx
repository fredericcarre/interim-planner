import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
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
