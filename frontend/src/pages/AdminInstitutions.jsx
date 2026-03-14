import React, { useEffect, useState } from 'react';
import { institutionAPI, adminAPI } from '../utils/api';
import { Card, Table, Badge, Button, Input } from '../components/UI';
import { Building2, Search, Plus, KeyRound, Ban, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminInstitutions() {
  const [institutions, setInstitutions] = useState([]);
  const [total, setTotal]     = useState(0);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = () => {
    setLoading(true);
    institutionAPI.getAll({ page, limit: 20, search })
      .then((res) => {
        setInstitutions(res.data.institutions);
        setTotal(res.data.total);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, search]);

  const handleBlacklist = async (id, isBlacklisted) => {
    const reason = isBlacklisted ? '' : window.prompt('Reason for blacklisting:');
    if (!isBlacklisted && !reason) return;
    try {
      await adminAPI.blacklistInstitution(id, reason);
      toast.success(isBlacklisted ? 'Institution un-blacklisted' : 'Institution blacklisted');
      fetchData();
    } catch { toast.error('Action failed'); }
  };

  const handleRegenKey = async (id) => {
    if (!window.confirm('Regenerate API key? The old key will stop working immediately.')) return;
    try {
      const res = await institutionAPI.regenKey(id);
      toast.success('New API key: ' + res.data.apiKey, { duration: 8000 });
    } catch { toast.error('Failed to regenerate key'); }
  };

  const columns = [
    { key: 'name',  label: 'Institution', render: (v) => (
      <span className="font-display font-medium text-slate-200">{v}</span>
    )},
    { key: 'code',  label: 'Code', render: (v) => (
      <span className="font-mono text-xs text-slate-400">{v || '—'}</span>
    )},
    { key: 'accreditationStatus', label: 'Accreditation', render: (v) => <Badge status={v} /> },
    { key: 'totalCertificatesIssued', label: 'Certificates', render: (v) => (
      <span className="font-mono text-sm text-jade-400">{v ?? 0}</span>
    )},
    { key: 'isBlacklisted', label: 'Status', render: (v) => (
      <Badge status={v ? 'fake' : 'valid'} label={v ? 'Blacklisted' : 'Active'} />
    )},
    { key: 'createdAt', label: 'Added', render: (v) => v ? format(new Date(v), 'dd MMM yy') : '—' },
    { key: '_id', label: '', render: (id, row) => (
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant={row.isBlacklisted ? 'outline' : 'danger'}
          onClick={() => handleBlacklist(id, row.isBlacklisted)}
        >
          {row.isBlacklisted
            ? <><CheckCircle className="w-3 h-3" /> Unblock</>
            : <><Ban className="w-3 h-3" /> Blacklist</>
          }
        </Button>
        <Button size="sm" variant="secondary" onClick={() => handleRegenKey(id)}>
          <KeyRound className="w-3 h-3" />
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Building2 className="w-6 h-6 text-jade-400" /> Institutions
          </h1>
          <p className="text-slate-500 font-mono text-sm mt-1">{total} registered</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4" /> Add Institution
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <CreateInstitutionForm
          onSuccess={() => { setShowCreate(false); fetchData(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Search bar */}
      <Card className="flex gap-3 items-center py-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="w-full bg-ink-800 border border-ink-600 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-jade-500/50 transition-colors"
            placeholder="Search institutions…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0">
        <Table columns={columns} data={institutions} loading={loading} emptyMessage="No institutions found" />
        {total > 20 && (
          <div className="flex justify-between px-6 py-4 border-t border-ink-700">
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

// ── Create Institution sub-form ───────────────────────────────────────────────
function CreateInstitutionForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({
    name: '', code: '', accreditationStatus: 'unverified',
    accreditationBody: '', naacGrade: '',
    'location.city': '', 'location.state': '',
    'contactDetails.email': '', 'contactDetails.website': '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Rebuild nested object from flat keys
    const payload = {
      name: form.name,
      code: form.code,
      accreditationStatus: form.accreditationStatus,
      accreditationBody: form.accreditationBody,
      naacGrade: form.naacGrade,
      location: { city: form['location.city'], state: form['location.state'] },
      contactDetails: {
        email: form['contactDetails.email'],
        website: form['contactDetails.website'],
      },
    };
    try {
      const res = await institutionAPI.create(payload);
      toast.success(`Institution created! API Key: ${res.data.apiKey}`, { duration: 10000 });
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Creation failed');
    } finally {
      setLoading(false);
    }
  };

  const f = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <Card className="border border-jade-500/15">
      <h3 className="font-display font-semibold text-slate-200 mb-5">Register New Institution</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Institution Name" placeholder="XYZ University" required {...f('name')} />
          <Input label="Short Code" placeholder="XYZ-UNIV" {...f('code')} />
          <Input label="City" placeholder="Mumbai" {...f('location.city')} />
          <Input label="State" placeholder="Maharashtra" {...f('location.state')} />
          <Input label="Contact Email" type="email" placeholder="registrar@xyz.edu" {...f('contactDetails.email')} />
          <Input label="Website" placeholder="https://xyz.edu" {...f('contactDetails.website')} />
          <Input label="Accreditation Body" placeholder="NAAC, UGC, AICTE" {...f('accreditationBody')} />
          <Input label="NAAC Grade" placeholder="A++, A+, A, B++" {...f('naacGrade')} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-display text-slate-400">Accreditation Status</label>
          <select
            className="w-full bg-ink-800 border border-ink-600 focus:border-jade-500/50 text-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none"
            value={form.accreditationStatus}
            onChange={(e) => setForm({ ...form, accreditationStatus: e.target.value })}
          >
            <option value="unverified">Unverified</option>
            <option value="pending">Pending</option>
            <option value="accredited">Accredited</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>
            <Plus className="w-4 h-4" /> Create Institution
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}