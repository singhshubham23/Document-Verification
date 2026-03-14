import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import { Card, Table, Badge, Button } from '../components/UI';
import { ScrollText, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminLogs() {
  const [logs, setLogs]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [result, setResult] = useState('');
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminAPI.getLogs({ page, limit: 30, result })
      .then((res) => {
        setLogs(res.data.logs);
        setTotal(res.data.total);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, result]);

  const FILTERS = [
    { value: '',          label: 'All' },
    { value: 'valid',     label: 'Valid' },
    { value: 'suspicious',label: 'Suspicious' },
    { value: 'fake',      label: 'Fake' },
    { value: 'not_found', label: 'Not Found' },
  ];

  const columns = [
    { key: 'certificateId', label: 'Certificate', render: (_, row) => (
      <span className="font-mono text-xs text-jade-400">
        {row.certificateId?.certificateId || '—'}
      </span>
    )},
    { key: 'certificateId', label: 'Student', render: (_, row) => (
      <span className="text-slate-300 text-sm">{row.certificateId?.studentName || '—'}</span>
    )},
    { key: 'verifierId', label: 'Verified By', render: (_, row) => (
      <div>
        <p className="text-slate-300 text-sm">{row.verifierId?.name || '—'}</p>
        <p className="text-slate-600 text-xs font-mono">{row.verifierId?.email || ''}</p>
      </div>
    )},
    { key: 'result',           label: 'Result',     render: (v) => <Badge status={v} /> },
    { key: 'confidenceScore',  label: 'Confidence', render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 rounded-full bg-ink-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              v >= 80 ? 'bg-jade-400' : v >= 50 ? 'bg-amber-400' : 'bg-rose-400'
            }`}
            style={{ width: `${v ?? 0}%` }}
          />
        </div>
        <span className="font-mono text-xs text-slate-400">{v ?? '—'}%</span>
      </div>
    )},
    { key: 'databaseMatched',  label: 'DB',         render: (v) => (
      <span className={`font-mono text-xs ${v ? 'text-jade-400' : 'text-slate-600'}`}>{v ? '✓' : '✗'}</span>
    )},
    { key: 'blockchainVerified', label: 'Chain',    render: (v) => (
      <span className={`font-mono text-xs ${v ? 'text-jade-400' : 'text-slate-600'}`}>{v ? '✓' : '✗'}</span>
    )},
    { key: 'processingTimeMs', label: 'Time',       render: (v) => (
      <span className="font-mono text-xs text-slate-500">{v ? `${v}ms` : '—'}</span>
    )},
    { key: 'createdAt', label: 'Timestamp', render: (v) => (
      <span className="text-slate-500 text-xs font-mono flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {v ? format(new Date(v), 'dd MMM yy HH:mm') : '—'}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100 flex items-center gap-3">
            <ScrollText className="w-6 h-6 text-jade-400" /> Audit Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-mono">{total} total verification events</p>
        </div>
      </div>

      {/* Filter bar */}
      <Card className="flex flex-wrap gap-2 items-center py-4">
        <Filter className="w-4 h-4 text-slate-500 mr-1" />
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setResult(f.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all
              ${result === f.value
                ? 'bg-jade-500/15 text-jade-400 border border-jade-500/25'
                : 'text-slate-500 hover:text-slate-300 hover:bg-ink-700'
              }`}
          >
            {f.label}
          </button>
        ))}
        <div className="w-full sm:w-auto sm:ml-auto text-xs font-mono text-slate-600">
          Showing {Math.min((page - 1) * 30 + 1, total)}–{Math.min(page * 30, total)} of {total}
        </div>
      </Card>

      {/* Logs table */}
      <Card className="p-0">
        <Table
          columns={columns}
          data={logs}
          loading={loading}
          emptyMessage="No verification logs found"
        />
        {total > 30 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-ink-700">
            <p className="text-xs text-slate-500 font-mono">Page {page} of {Math.ceil(total / 30)}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button variant="secondary" size="sm" disabled={page * 30 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}