import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import { certAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Badge, Table, Input } from '../components/UI';
import {
  FileText, Plus, Upload, Search, XCircle, Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TEMPLATES = [
  { id: 'classic', label: 'Classic', desc: 'Traditional certificate layout' },
  { id: 'modern',  label: 'Modern',  desc: 'Clean, minimal layout' },
];

export default function InstitutionCertificates() {
  const location = useLocation();
  const [certs, setCerts]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setShowUpload(params.get('upload') === '1');
  }, [location.search]);

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const res = await certAPI.getAll({ page, limit: 15, search, status });
      setCerts(res.data.certificates);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCerts(); }, [page, search, status]);

  const handleRevoke = async (id) => {
    const reason = window.prompt('Reason for revocation:');
    if (!reason) return;
    try {
      await certAPI.revoke(id, reason);
      toast.success('Certificate revoked');
      fetchCerts();
    } catch {
      toast.error('Revocation failed');
    }
  };

  const columns = [
    { key: 'certificateId', label: 'Cert ID', render: (v) => <span className="font-mono text-xs text-jade-400">{v}</span> },
    { key: 'studentName',   label: 'Student' },
    { key: 'course',        label: 'Course',  render: (v) => <span className="text-slate-400 text-xs">{v}</span> },
    { key: 'issueDate',     label: 'Issued',  render: (v) => v ? format(new Date(v), 'dd MMM yy') : '-' },
    { key: 'verificationStatus', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: '_id', label: '', render: (id, row) => (
      row.verificationStatus !== 'revoked' ? (
        <Button variant="danger" size="sm" onClick={() => handleRevoke(id)}>
          <XCircle className="w-3 h-3" /> Revoke
        </Button>
      ) : null
    )},
  ];

  const statuses = [
    { value: '', label: 'All' },
    { value: 'unverified', label: 'Unverified' },
    { value: 'valid', label: 'Valid' },
    { value: 'suspicious', label: 'Suspicious' },
    { value: 'fake', label: 'Fake' },
    { value: 'revoked', label: 'Revoked' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100">Certificates</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total records</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          <Plus className="w-4 h-4" /> Upload Certificate
        </Button>
      </div>

      {showUpload && (
        <UploadForm onSuccess={() => { setShowUpload(false); fetchCerts(); }} />
      )}

      <Card className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center py-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="w-full bg-ink-800 border border-ink-600 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-jade-500/50 transition-colors"
            placeholder="Search by name, roll no, or cert ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatus(s.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all
                ${status === s.value
                  ? 'bg-jade-500/15 text-jade-400 border border-jade-500/25'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-0">
        <Table columns={columns} data={certs} loading={loading} emptyMessage="No certificates found" />

        {total > 15 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-ink-700">
            <p className="text-xs text-slate-500 font-mono">
              Showing {(page - 1) * 15 + 1}-{Math.min(page * 15, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button variant="secondary" size="sm" disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function UploadForm({ onSuccess }) {
  const { user } = useAuth();
  const [template, setTemplate] = useState('classic');
  const [qrPreview, setQrPreview] = useState('');
  const [form, setForm] = useState({
    studentName: '', rollNumber: '', course: '',
    specialization: '', issueDate: '',
    'marks[obtained]': '', 'marks[total]': '',
    'marks[percentage]': '', grade: '', cgpa: '',
  });
  const [file, setFile]   = useState(null);
  const [loading, setLoading] = useState(false);

  const institutionName =
    user?.institutionId?.name || user?.institutionName || 'Institution';

  useEffect(() => {
    const payload = JSON.stringify({
      certificateId: form.rollNumber ? `PREVIEW-${form.rollNumber}` : 'PREVIEW-CERT',
      hash: 'PREVIEW',
      issuedBy: institutionName,
      issuedAt: form.issueDate || new Date().toISOString().slice(0, 10),
    });
    QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 140 })
      .then(setQrPreview)
      .catch(() => setQrPreview(''));
  }, [form.rollNumber, form.issueDate, institutionName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (file) fd.append('certificate', file);
    setLoading(true);
    try {
      await certAPI.upload(fd);
      toast.success('Certificate uploaded!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
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
      <h3 className="font-display font-semibold text-slate-200 mb-4">New Certificate</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Student Name" placeholder="Full name" required {...f('studentName')} />
          <Input label="Roll Number"  placeholder="e.g. CS2021001" required {...f('rollNumber')} />
          <Input label="Course"       placeholder="B.Tech Computer Science" required {...f('course')} />
          <Input label="Specialization" placeholder="AI and ML (optional)" {...f('specialization')} />
          <Input label="Issue Date" type="date" required {...f('issueDate')} />
          <Input label="Grade" placeholder="A+, B, etc." {...f('grade')} />
          <Input label="Marks Obtained" type="number" {...f('marks[obtained]')} />
          <Input label="Marks Total"    type="number" {...f('marks[total]')} />
          <Input label="Percentage" type="number" step="0.01" {...f('marks[percentage]')} />
          <Input label="CGPA" type="number" step="0.01" {...f('cgpa')} />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-display text-slate-400">Template</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                className={`px-3 py-2.5 rounded-xl text-sm text-left font-display transition-all
                  ${template === t.id
                    ? 'bg-jade-500/15 text-jade-400 border border-jade-500/30'
                    : 'bg-ink-800 text-slate-400 border border-ink-700 hover:border-ink-600 hover:text-slate-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span className="font-semibold">{t.label}</span>
                </div>
                <p className="text-xs mt-1 text-slate-500">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <CertificatePreview
          template={template}
          form={form}
          institutionName={institutionName}
          qrPreview={qrPreview}
        />

        <div>
          <label className="block text-sm font-display text-slate-400 mb-1.5">Certificate File (optional)</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-ink-700 file:text-slate-300 file:text-sm file:font-display hover:file:bg-ink-600 cursor-pointer"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>
            <Upload className="w-4 h-4" /> Upload
          </Button>
          <Button type="button" variant="secondary" onClick={onSuccess}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}

function CertificatePreview({ template, form, institutionName, qrPreview }) {
  const title = template === 'modern' ? 'Certificate of Achievement' : 'Certificate of Completion';
  const accent = template === 'modern' ? 'border-sky-400/30' : 'border-amber-400/30';
  const banner = template === 'modern' ? 'bg-sky-400/10 text-sky-300' : 'bg-amber-400/10 text-amber-300';

  return (
    <Card className={`border ${accent} p-4`}>
      <div className={`text-xs font-mono px-2 py-1 rounded-full inline-flex items-center gap-2 ${banner}`}>
        <FileText className="w-3.5 h-3.5" />
        Preview with QR (not published)
      </div>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        <div className="lg:col-span-2 space-y-2">
          <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">{institutionName}</p>
          <h4 className="font-display text-lg text-slate-100">{title}</h4>
          <p className="text-slate-500 text-sm">
            This certifies that <span className="text-slate-200 font-semibold">{form.studentName || 'Student Name'}</span>
          </p>
          <p className="text-slate-500 text-sm">
            has completed <span className="text-slate-200 font-semibold">{form.course || 'Course Name'}</span>
          </p>
          <p className="text-slate-500 text-sm">
            Roll No: <span className="text-slate-200 font-semibold">{form.rollNumber || 'ROLL-0000'}</span>
          </p>
          <p className="text-slate-500 text-sm">
            Issue Date: <span className="text-slate-200 font-semibold">{form.issueDate || 'YYYY-MM-DD'}</span>
          </p>
        </div>
        <div className="flex items-center justify-center">
          {qrPreview ? (
            <img
              src={qrPreview}
              alt="QR preview"
              className="w-36 h-36 rounded-lg bg-white p-2"
            />
          ) : (
            <div className="w-36 h-36 rounded-lg bg-ink-800 border border-ink-700 flex items-center justify-center text-xs text-slate-500">
              QR preview
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
