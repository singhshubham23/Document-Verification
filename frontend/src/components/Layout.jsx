import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Spinner } from './UI';
import { Menu, ShieldCheck } from 'lucide-react';

export default function Layout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 lg:hidden glass-strong border-b border-ink-700">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-jade-400 hover:bg-ink-700 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-7 h-7 rounded-lg bg-jade-500/20 border border-jade-500/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-jade-400" />
          </div>
          <h1 className="font-display font-bold text-slate-100 text-sm">HealBharat</h1>
        </div>
      </div>

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 overflow-y-auto animate-fade-up min-w-0">
        <Outlet />
      </main>
    </div>
  );
}