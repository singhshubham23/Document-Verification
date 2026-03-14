import React, { useState, useEffect } from 'react';
import { fraudAPI, verifyAPI } from '../utils/api';
import { Card, Button, Input, Badge } from '../components/UI';
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const FRAUD_TYPES = [
  { value: 'tampered_grades',            label: 'Tampered Grades' },
  { value: 'edited_photo',               label: 'Edited Photo' },
  { value: 'forged_signature',           label: 'Forged Signature' },
  { value: 'invalid_certificate_number', label: 'Invalid Certificate Number' },
  { value: 'non_existent_institution',   label: 'Non-existent Institution' },
  { value: 'cloned_certificate',         label: 'Cloned Certificate' },
  { value: 'expired_certificate',        label: 'Expired Certificate' },
  { value: 'revoked_certificate',        label: 'Revoked Certificate' },
  { value: 'duplicate_submission',       label: 'Duplicate Submission' },
  { value: 'other',                      label: 'Other' },
];

export default function FraudReportPage() {
  const [form, setForm] = useState({
    certificateId: '',
    fraudType: '',
    description: '',
  });
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    fraudAPI.myReports()
      .then((res) => { setMyReports(res.data.reports); setReportsLoading(false); })
      .catch(() => setReportsLoading(false));
  }, [submitted]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fraudType) { toast.error('Select a fraud type'); return; }
    if (!form.description.trim()) { toast.error('Add a description'); return; }

    setLoading(true);
    try {
      // certificateId is optional — can be MongoDB _id or cert string ID
      await fraudAPI.report({
        certificateId: form.certificateId || undefined,
        fraudType: form.fraudType,
        description: form.description,
      });
      toast.success('Fraud report submitted successfully');
      setForm({ certificateId: '', fraudType: '', description: '' });
      setSubmitted((s) => !s); // trigger myReports refetch
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    open:         'status-suspicious',
    under_review: 'status-unverified',
    confirmed:    'status-fake',
    dismissed:    'status-revoked',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-100 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-amber-400" /> Report Fraud
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Report suspicious or fraudulent certificates for admin review
        </p>
      </div>

      {/* Report form */}
      <Card className="border border-amber-400/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-amber-400/10">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-slate-200">Submit a Report</h2>
            <p className="text-slate-500 text-xs">All reports are reviewed by our admin team</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Certificate ID (optional) */}
          <Input
            label="Certificate ID (optional)"
            placeholder="CERT-XXXXXXXX — leave blank if unknown"
            value={form.certificateId}
            onChange={(e) => setForm({ ...form, certificateId: e.target.value })}
          />

          {/* Fraud type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-display text-slate-400">
              Fraud Type <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FRAUD_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, fraudType: t.value })}
                  className={`px-3 py-2.5 rounded-xl text-sm text-left font-display transition-all
                    ${form.fraudType === t.value
                      ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                      : 'bg-ink-800 text-slate-400 border border-ink-700 hover:border-ink-600 hover:text-slate-300'
                    }`}
                >
                  {form.fraudType === t.value && (
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />
                  )}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-display text-slate-400">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              className="w-full bg-ink-800 border border-ink-600 focus:border-jade-500/50 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none h-28 font-body"
              placeholder="Describe what you observed. Be as specific as possible — include dates, names, discrepancies you noticed…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
            <p className="text-xs text-slate-600 font-mono text-right">
              {form.description.length} chars
            </p>
          </div>

          <Button type="submit" loading={loading} variant="danger" size="lg" className="w-full">
            <ShieldAlert className="w-4 h-4" /> Submit Fraud Report
          </Button>
        </form>
      </Card>

      {/* My past reports */}
      <div>
        <h2 className="font-display font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" /> My Reports
        </h2>

        {reportsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl shimmer" />
            ))}
          </div>
        ) : myReports.length === 0 ? (
          <Card>
            <p className="text-center text-slate-600 font-mono text-sm py-6">
              You haven't submitted any reports yet
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {myReports.map((r) => (
              <Card key={r._id} className="flex flex-col sm:flex-row items-start justify-between gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-jade-400">
                      {r.certificateId?.certificateId || 'No cert ID'}
                    </span>
                    {r.certificateId?.studentName && (
                      <span className="text-slate-500 text-xs">— {r.certificateId.studentName}</span>
                    )}
                  </div>
                  <p className="text-sm font-display font-medium text-slate-300">
                    {FRAUD_TYPES.find((t) => t.value === r.fraudType)?.label || r.fraudType}
                  </p>
                  {r.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{r.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge status={r.status} />
                  <span className="text-xs text-slate-600 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {r.createdAt ? format(new Date(r.createdAt), 'dd MMM yy') : '—'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}