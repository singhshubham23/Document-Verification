import React, { useEffect, useState } from 'react';
import { verifyAPI } from '../utils/api';
import { Card, Badge, Table } from '../components/UI';
import { ScrollText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../components/UI';

export default function HistoryPage() {
  const [logs, setLogs]   = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyAPI.getHistory({ page, limit: 20 })
      .then((res) => {
        setLogs(res.data.logs);
        setTotal(res.data.total);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [page]);

  const columns = [
    { key: 'certificateId', label: 'Certificate', render: (_, row) => (
      <span className="font-mono text-xs text-jade-400">{row.certificateId?.certificateId || '—'}</span>
    )},
    { key: 'certificateId', label: 'Student', render: (_, row) => row.certificateId?.studentName || '—' },
    { key: 'result',        label: 'Result',  render: (v) => <Badge status={v} /> },
    { key: 'confidenceScore', label: 'Confidence', render: (v) => (
      <span className="font-mono text-sm text-slate-400">{v ?? '—'}%</span>
    )},
    { key: 'databaseMatched', label: 'DB Match', render: (v) => (
      <span className={`font-mono text-xs ${v ? 'text-jade-400' : 'text-slate-600'}`}>{v ? 'Yes' : 'No'}</span>
    )},
    { key: 'createdAt', label: 'Verified At', render: (v) => (
      <span className="text-slate-500 text-xs font-mono flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {v ? format(new Date(v), 'dd MMM yy HH:mm') : '—'}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-100 flex items-center gap-3">
          <ScrollText className="w-6 h-6 text-jade-400" /> Verification History
        </h1>
        <p className="text-slate-500 text-sm mt-1">{total} total verifications</p>
      </div>

      <Card className="p-0">
        <Table columns={columns} data={logs} loading={loading} emptyMessage="No verification history yet" />
        {total > 20 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-ink-700">
            <p className="text-xs text-slate-500 font-mono">Page {page} of {Math.ceil(total / 20)}</p>
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