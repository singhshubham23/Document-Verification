// AdminUsers.jsx
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import { Card, Table, Badge, Button } from '../components/UI';
import { Users, Search } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    adminAPI.getUsers({ page, limit: 20, search }).then((res) => {
      setUsers(res.data.users);
      setTotal(res.data.total);
      setLoading(false);
    });
  };

  useEffect(() => { fetch(); }, [page, search]);

  const toggle = async (id) => {
    try {
      await adminAPI.toggleUser(id);
      toast.success('User status updated');
      fetch();
    } catch { toast.error('Failed'); }
  };

  const columns = [
    { key: 'name',  label: 'Name' },
    { key: 'email', label: 'Email', render: (v) => <span className="font-mono text-xs text-slate-400">{v}</span> },
    { key: 'role',  label: 'Role',  render: (v) => <Badge status={v} /> },
    { key: 'isEmailVerified', label: 'Verified', render: (v) => (
      <span className={`font-mono text-xs ${v ? 'text-jade-400' : 'text-amber-400'}`}>{v ? 'Yes' : 'Pending'}</span>
    )},
    { key: 'isActive', label: 'Active', render: (v) => (
      <span className={`font-mono text-xs ${v ? 'text-jade-400' : 'text-rose-400'}`}>{v ? 'Active' : 'Disabled'}</span>
    )},
    { key: 'createdAt', label: 'Joined', render: (v) => v ? format(new Date(v), 'dd MMM yy') : '—' },
    { key: '_id', label: '', render: (id, row) => (
      <Button variant={row.isActive ? 'danger' : 'outline'} size="sm" onClick={() => toggle(id)}>
        {row.isActive ? 'Disable' : 'Enable'}
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Users className="w-6 h-6 text-jade-400" /> Users
        </h1>
        <p className="text-slate-500 font-mono text-sm">{total} total</p>
      </div>

      <Card className="flex gap-3 items-center py-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="w-full bg-ink-800 border border-ink-600 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-jade-500/50"
            placeholder="Search users…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </Card>

      <Card className="p-0">
        <Table columns={columns} data={users} loading={loading} emptyMessage="No users found" />
        {total > 20 && (
          <div className="flex justify-between px-6 py-4 border-t border-ink-700">
            <p className="text-xs text-slate-500 font-mono">Page {page}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button variant="secondary" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── AdminFraud ──────────────────────────────────────────────────────────────
export function AdminFraud() {
  const [reports, setReports] = useState([]);
  const [total, setTotal]   = useState(0);
  const [status, setStatus] = useState('');
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    adminAPI.getFraudReports({ page, limit: 20, status }).then((res) => {
      setReports(res.data.reports);
      setTotal(res.data.total);
      setLoading(false);
    });
  };

  useEffect(() => { fetch(); }, [page, status]);

  const updateStatus = async (id, newStatus) => {
    try {
      await adminAPI.updateFraud(id, { status: newStatus });
      toast.success('Report updated');
      fetch();
    } catch { toast.error('Failed'); }
  };

  const columns = [
    { key: 'certificateId', label: 'Certificate', render: (_, row) => (
      <span className="font-mono text-xs text-jade-400">{row.certificateId?.certificateId || '—'}</span>
    )},
    { key: 'fraudType', label: 'Type', render: (v) => (
      <span className="text-xs font-mono text-slate-400">{v?.replace(/_/g, ' ')}</span>
    )},
    { key: 'severity', label: 'Severity', render: (v) => <Badge status={v === 'critical' || v === 'high' ? 'fake' : 'suspicious'} label={v} /> },
    { key: 'status',   label: 'Status',   render: (v) => <Badge status={v} /> },
    { key: 'autoDetected', label: 'Source', render: (v) => (
      <span className={`font-mono text-xs ${v ? 'text-violet-400' : 'text-slate-400'}`}>{v ? 'AI' : 'Manual'}</span>
    )},
    { key: 'createdAt', label: 'Date', render: (v) => v ? format(new Date(v), 'dd MMM yy') : '—' },
    { key: '_id', label: '', render: (id, row) => (
      row.status === 'open' ? (
        <div className="flex gap-1">
          <Button size="sm" variant="danger" onClick={() => updateStatus(id, 'confirmed')}>Confirm</Button>
          <Button size="sm" variant="secondary" onClick={() => updateStatus(id, 'dismissed')}>Dismiss</Button>
        </div>
      ) : null
    )},
  ];

  const STATUSES = [
    { value: '', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'dismissed', label: 'Dismissed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-slate-100">Fraud Reports</h1>
        <p className="text-slate-500 font-mono text-sm">{total} total</p>
      </div>

      <Card className="flex flex-wrap gap-2 py-4 items-center">
        {STATUSES.map((s) => (
          <button key={s.value}
            onClick={() => { setStatus(s.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all
              ${status === s.value ? 'bg-jade-500/15 text-jade-400 border border-jade-500/25' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {s.label}
          </button>
        ))}
      </Card>

      <Card className="p-0">
        <Table columns={columns} data={reports} loading={loading} emptyMessage="No fraud reports" />
      </Card>
    </div>
  );
}