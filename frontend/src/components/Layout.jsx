import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Spinner } from './UI';

export default function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-ink-950 bg-grid-ink bg-grid">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 overflow-y-auto animate-fade-up">
        <Outlet />
      </main>
    </div>
  );
}