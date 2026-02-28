import React from 'react';
import { Loader2 } from 'lucide-react';

// ── Button ─────────────────────────────────────────────────────────────────
export const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, className = '', ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-display font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:  'bg-jade-500 hover:bg-jade-400 text-ink-950 shadow-glow-sm hover:shadow-glow',
    secondary:'bg-ink-700 hover:bg-ink-600 text-slate-200 border border-ink-600 hover:border-jade-400/30',
    danger:   'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30',
    ghost:    'hover:bg-ink-700 text-slate-300 hover:text-jade-400',
    outline:  'border border-jade-500/40 text-jade-400 hover:bg-jade-500/10',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

// ── Card ───────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', glow = false, ...props }) => (
  <div
    className={`glass rounded-2xl p-6 ${glow ? 'animate-pulse-glow' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);

// ── Badge ──────────────────────────────────────────────────────────────────
const BADGE_MAP = {
  valid:      'status-valid',
  suspicious: 'status-suspicious',
  fake:       'status-fake',
  revoked:    'status-revoked',
  unverified: 'status-unverified',
  open:       'status-suspicious',
  confirmed:  'status-fake',
  dismissed:  'status-revoked',
  accredited: 'status-valid',
  pending:    'status-suspicious',
  admin:      'text-violet-400 bg-violet-400/10 border border-violet-400/20',
  institution:'text-sky-400 bg-sky-400/10 border border-sky-400/20',
  verifier:   'text-slate-300 bg-slate-400/10 border border-slate-400/20',
};

export const Badge = ({ status, label, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wide ${BADGE_MAP[status] || 'status-unverified'} ${className}`}>
    {label || status}
  </span>
);

// ── Input ──────────────────────────────────────────────────────────────────
export const Input = ({ label, error, className = '', ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-display text-slate-400">{label}</label>}
    <input
      className={`w-full bg-ink-800 border ${error ? 'border-rose-500/50 focus:border-rose-500' : 'border-ink-600 focus:border-jade-500/50'} text-slate-200 placeholder-slate-600 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors font-body ${className}`}
      {...props}
    />
    {error && <p className="text-rose-400 text-xs">{error}</p>}
  </div>
);

// ── Spinner ────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <Loader2 className={`animate-spin text-jade-400 ${sizes[size]} ${className}`} />
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, color = 'jade', sub }) => {
  const colors = {
    jade:   'text-jade-400 bg-jade-400/10',
    amber:  'text-amber-400 bg-amber-400/10',
    rose:   'text-rose-400 bg-rose-400/10',
    violet: 'text-violet-400 bg-violet-400/10',
    sky:    'text-sky-400 bg-sky-400/10',
  };
  return (
    <Card className="flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-0.5">{label}</p>
        <p className="font-display text-2xl font-bold text-slate-100">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
};

// ── Table ──────────────────────────────────────────────────────────────────
export const Table = ({ columns, data, loading, emptyMessage = 'No data found' }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-ink-700">
          {columns.map((col) => (
            <th key={col.key} className="text-left py-3 px-4 text-slate-500 font-mono text-xs uppercase tracking-widest font-normal">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-ink-800">
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-4">
                  <div className="h-4 rounded shimmer w-3/4" />
                </td>
              ))}
            </tr>
          ))
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="py-12 text-center text-slate-600 font-mono text-sm">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row, i) => (
            <tr key={i} className="border-b border-ink-800 hover:bg-ink-800/50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-4 text-slate-300">
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// ── Empty State ────────────────────────────────────────────────────────────
export const Empty = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
    {Icon && <Icon className="w-10 h-10 text-slate-700" />}
    <p className="font-display text-slate-400 font-semibold">{title}</p>
    {description && <p className="text-slate-600 text-sm max-w-xs">{description}</p>}
  </div>
);