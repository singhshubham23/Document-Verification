import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, LayoutDashboard, FileText, Search,
  Building2, Users, AlertTriangle, ScrollText,
  LogOut, ChevronRight, X
} from 'lucide-react';

const NAV = {
  verifier: [
    { to: '/verify',        icon: Search,        label: 'Verify Certificate' },
    { to: '/history',       icon: ScrollText,    label: 'My History' },
    { to: '/fraud/report',  icon: AlertTriangle, label: 'Report Fraud' },
  ],
  institution: [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/certificates', icon: FileText,        label: 'Certificates' },
    { to: '/verify',       icon: Search,          label: 'Verify' },
    { to: '/history',      icon: ScrollText,      label: 'History' },
  ],
  admin: [
    { to: '/admin',                icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users',          icon: Users,           label: 'Users' },
    { to: '/admin/institutions',   icon: Building2,       label: 'Institutions' },
    { to: '/admin/fraud',          icon: AlertTriangle,   label: 'Fraud Reports' },
    { to: '/admin/logs',           icon: ScrollText,      label: 'Audit Logs' },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV[user?.role] || NAV.verifier;

  const roleColors = {
    admin: 'text-violet-400',
    institution: 'text-sky-400',
    verifier: 'text-jade-400',
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          w-64 h-screen flex flex-col glass-strong border-r border-ink-700 fixed left-0 top-0 z-50
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo + close button */}
        <div className="px-6 py-6 border-b border-ink-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-jade-500/20 border border-jade-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-jade-400" />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-slate-100 text-sm leading-tight">HealBharat</h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Cert Validator</p>
            </div>
            {/* Close button — mobile only */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-ink-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-medium transition-all group
                 ${isActive
                  ? 'bg-jade-500/15 text-jade-400 border border-jade-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-ink-700'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="px-3 py-4 border-t border-ink-700">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-2">
            <div className="w-8 h-8 rounded-full bg-ink-700 border border-ink-600 flex items-center justify-center">
              <span className="text-xs font-display font-bold text-slate-300">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className={`text-xs font-mono capitalize ${roleColors[user?.role]}`}>{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 transition-all font-display"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}