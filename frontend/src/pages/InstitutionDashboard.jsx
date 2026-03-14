import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { certAPI } from '../utils/api';
import { Button, Card, Badge, Table, StatCard } from '../components/UI';
import {
  FileText, CheckCircle, XCircle, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function InstitutionDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const statuses = ['valid', 'suspicious', 'fake', 'revoked', 'unverified'];
      const [allRes, ...statusRes] = await Promise.all([
        certAPI.getAll({ page: 1, limit: 5 }),
        ...statuses.map((s) => certAPI.getAll({ page: 1, limit: 1, status: s })),
      ]);

      setStats({
        total: allRes.data.total,
        valid: statusRes[0].data.total,
        suspicious: statusRes[1].data.total,
        fake: statusRes[2].data.total,
        revoked: statusRes[3].data.total,
        unverified: statusRes[4].data.total,
      });
      setRecent(allRes.data.certificates || []);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const columns = [
    { key: 'certificateId', label: 'Cert ID', render: (v) => <span className="font-mono text-xs text-jade-400">{v}</span> },
    { key: 'studentName',   label: 'Student' },
    { key: 'course',        label: 'Course',  render: (v) => <span className="text-slate-400 text-xs">{v}</span> },
    { key: 'issueDate',     label: 'Issued',  render: (v) => v ? format(new Date(v), 'dd MMM yy') : '-' },
    { key: 'verificationStatus', label: 'Status', render: (v) => <Badge status={v} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100">Institution Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of recent activity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/certificates')}>
            <FileText className="w-4 h-4" /> Manage Certificates
          </Button>
          <Button onClick={() => navigate('/certificates?upload=1')}>
            <ShieldCheck className="w-4 h-4" /> Upload Certificate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={FileText} label="Total Certificates" value={stats?.total} color="sky" />
        <StatCard icon={CheckCircle} label="Valid" value={stats?.valid} color="jade" />
        <StatCard icon={AlertTriangle} label="Suspicious" value={stats?.suspicious} color="amber" />
        <StatCard icon={XCircle} label="Fake" value={stats?.fake} color="rose" />
        <StatCard icon={ShieldCheck} label="Unverified" value={stats?.unverified} color="violet" />
        <StatCard icon={XCircle} label="Revoked" value={stats?.revoked} color="rose" />
      </div>

      <Card className="p-0">
        <div className="px-6 py-4 border-b border-ink-700 flex items-center justify-between">
          <h2 className="font-display font-semibold text-slate-200">Recent Certificates</h2>
          <Button variant="ghost" onClick={() => navigate('/certificates')}>View all</Button>
        </div>
        <Table columns={columns} data={recent} loading={loading} emptyMessage="No certificates yet" />
      </Card>
    </div>
  );
}
