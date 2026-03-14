import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import { StatCard, Card, Badge, Table, Spinner } from '../components/UI';
import {
  Users, FileText, Building2, ShieldAlert,
  Activity, XCircle, TrendingUp
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { format } from 'date-fns';

const PIE_COLORS = { valid: '#34d399', suspicious: '#fbbf24', fake: '#fb7185', not_found: '#64748b' };
const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs font-mono border border-ink-600">
      <p className="text-slate-400">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [fraud, setFraud] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats().then((res) => {
      setStats(res.data.stats);
      setFraud(res.data.recentFraud || []);
      // Store trend/breakdown on window for charts
      window.__hb_trend = res.data.fraudTrend || [];
      window.__hb_breakdown = res.data.verificationBreakdown || [];
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const trendData = (window.__hb_trend || []).map((d) => ({
    date: d._id?.slice(5) || d._id, // MM-DD
    count: d.count,
  }));

  const breakdownData = (window.__hb_breakdown || []).map((d) => ({
    name: d._id,
    value: d.count,
    fill: PIE_COLORS[d._id] || '#64748b',
  }));

  const fraudColumns = [
    { key: 'certificateId', label: 'Certificate', render: (_, row) => (
      <span className="font-mono text-xs text-jade-400">{row.certificateId?.certificateId || '—'}</span>
    )},
    { key: 'reportedBy', label: 'Reported By', render: (_, row) => row.reportedBy?.email || '—' },
    { key: 'fraudType', label: 'Type', render: (v) => (
      <span className="font-mono text-xs text-slate-400">{v?.replace(/_/g, ' ')}</span>
    )},
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: 'createdAt', label: 'Reported', render: (v) => v ? format(new Date(v), 'dd MMM HH:mm') : '—' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-100">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">System overview and fraud monitoring</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard icon={Users}       label="Total Users"         value={stats?.totalUsers}         color="jade" />
        <StatCard icon={Building2}   label="Institutions"        value={stats?.totalInstitutions}  color="sky" />
        <StatCard icon={FileText}    label="Certificates"        value={stats?.totalCertificates}  color="violet" />
        <StatCard icon={Activity}    label="Verifications"       value={stats?.totalVerifications} color="jade" />
        <StatCard icon={ShieldAlert} label="Open Fraud Reports"  value={stats?.openFraudReports}   color="amber" />
        <StatCard icon={XCircle}     label="Fake Certificates"   value={stats?.fakeCerts}          color="rose" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Fraud trend */}
        <Card className="xl:col-span-2">
          <h3 className="font-display font-semibold text-slate-300 mb-4 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Fraud Reports — Last 30 Days
          </h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#fbbf24" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Area type="monotone" dataKey="count" stroke="#fbbf24" fill="url(#fraudGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-600 font-mono text-sm">No fraud trend data</div>
          )}
        </Card>

        {/* Verification breakdown */}
        <Card>
          <h3 className="font-display font-semibold text-slate-300 mb-4 text-sm">Verification Results</h3>
          {breakdownData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {breakdownData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {breakdownData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                      <span className="text-slate-400 capitalize">{d.name}</span>
                    </span>
                    <span className="text-slate-300">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-600 font-mono text-sm">No data</div>
          )}
        </Card>
      </div>

      {/* Recent fraud */}
      <Card>
        <h3 className="font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Recent Fraud Reports
        </h3>
        <Table columns={fraudColumns} data={fraud} loading={false} emptyMessage="No recent fraud reports" />
      </Card>
    </div>
  );
}