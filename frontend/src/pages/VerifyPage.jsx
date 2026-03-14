import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { verifyAPI, fraudAPI } from '../utils/api';
import { Button, Card, Badge, Spinner } from '../components/UI';
import {
  Search, Upload, QrCode, CheckCircle2, AlertTriangle,
  XCircle, Info, ShieldCheck, ShieldAlert, ShieldOff,
  GraduationCap, Hash, ChevronDown, ChevronUp, Sparkles, Cpu, Scan,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const METHODS = [
  { id: 'id',     icon: Search,  label: 'Certificate ID' },
  { id: 'upload', icon: Upload,  label: 'Upload File' },
  { id: 'qr',     icon: QrCode,  label: 'QR Code' },
];

const RESULT_CONFIG = {
  valid:      { icon: CheckCircle2, color: 'text-jade-400', bg: 'bg-jade-400/10 border-jade-400/20', label: 'VALID', tagline: 'Certificate is authentic and verified.' },
  suspicious: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', label: 'SUSPICIOUS', tagline: 'Anomalies detected. Manual review recommended.' },
  fake:       { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20', label: 'FAKE', tagline: 'Certificate appears fraudulent. Do not accept.' },
  not_found:  { icon: Info, color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/20', label: 'NOT FOUND', tagline: 'Certificate not found in any database.' },
};

export default function VerifyPage() {
  const [method, setMethod]   = useState('id');
  const [certId, setCertId]   = useState('');
  const [qrData, setQrData]   = useState('');
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [showAnomalies, setShowAnomalies] = useState(false);

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxFiles: 1,
  });

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);
    try {
      let res;
      if (method === 'id') {
        if (!certId.trim()) { toast.error('Enter a certificate ID'); return; }
        res = await verifyAPI.byId(certId.trim());
      } else if (method === 'upload') {
        if (!file) { toast.error('Select a file first'); return; }
        const fd = new FormData();
        fd.append('certificate', file);
        res = await verifyAPI.byUpload(fd);
      } else {
        if (!qrData.trim()) { toast.error('Paste QR payload'); return; }
        res = await verifyAPI.byQR(qrData.trim());
      }
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReportFraud = async () => {
    if (!result?.certificate?._id) return;
    try {
      await fraudAPI.report({
        certificateId: result.certificate._id,
        fraudType: 'other',
        description: 'Manually reported after verification check.',
      });
      toast.success('Fraud report submitted.');
    } catch {
      toast.error('Could not submit report.');
    }
  };

  const cfg = result ? RESULT_CONFIG[result.result] || RESULT_CONFIG.not_found : null;
  const ResultIcon = cfg?.icon;
  const confidenceColor =
    result?.result === 'valid'
      ? 'bg-jade-400'
      : result?.result === 'suspicious'
        ? 'bg-amber-400'
        : result?.result === 'fake'
          ? 'bg-rose-400'
          : 'bg-slate-500';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-ink-700 bg-gradient-to-br from-ink-900 via-ink-900 to-ink-950 p-6 sm:p-8">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-jade-500/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-16 left-1/3 w-80 h-40 bg-amber-400/10 blur-3xl rounded-full" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-jade-500/30 bg-jade-500/10 px-3 py-1 text-xs font-mono text-jade-300">
            <Sparkles className="w-3.5 h-3.5" />
            AI + Blockchain Verification Lab
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-display font-bold text-slate-100">
            Verify Certificates with Confidence
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
            Cross-check database records, OCR extraction, and blockchain hashes in one flow.
            Pick a method below and get a clear verdict with explainable anomalies.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Cpu, label: 'OCR + AI', text: 'Text extraction and anomaly detection' },
              { icon: ShieldCheck, label: 'DB Cross-Check', text: 'Institution records match' },
              { icon: Scan, label: 'QR & Hash', text: 'On-chain integrity check' },
            ].map(({ icon: Icon, label, text }) => (
              <div key={label} className="glass rounded-2xl p-4 border border-ink-700">
                <div className="flex items-center gap-2 text-jade-300">
                  <Icon className="w-4 h-4" />
                  <p className="text-xs font-mono uppercase tracking-widest">{label}</p>
                </div>
                <p className="text-slate-500 text-sm mt-2">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            {METHODS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => { setMethod(id); setResult(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-display font-medium transition-all
                  ${method === id
                    ? 'bg-jade-500/15 text-jade-400 border border-jade-500/25'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-ink-700'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {method === 'id' && (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="flex-1 bg-ink-800 border border-ink-600 focus:border-jade-500/50 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-3 outline-none transition-colors font-mono text-sm"
                placeholder="CERT-XXXXXXXX"
                value={certId}
                onChange={(e) => setCertId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
              <Button onClick={handleVerify} loading={loading} size="lg">
                <Search className="w-4 h-4" /> Verify
              </Button>
            </div>
          )}

          {method === 'upload' && (
            <div className="space-y-3">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                  ${isDragActive
                    ? 'border-jade-400/50 bg-jade-500/5'
                    : 'border-ink-600 hover:border-jade-500/30 hover:bg-ink-800/50'
                  }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                {file ? (
                  <p className="text-jade-400 font-mono text-sm">{file.name}</p>
                ) : (
                  <>
                    <p className="text-slate-400 text-sm font-display font-medium">Drop certificate here or click to browse</p>
                    <p className="text-slate-600 text-xs mt-1">JPG, PNG, PDF - max 10MB</p>
                  </>
                )}
              </div>
              <Button onClick={handleVerify} loading={loading} className="w-full" size="lg">
                <Search className="w-4 h-4" /> Verify Certificate
              </Button>
            </div>
          )}

          {method === 'qr' && (
            <div className="space-y-3">
              <textarea
                className="w-full bg-ink-800 border border-ink-600 focus:border-jade-500/50 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-3 outline-none transition-colors font-mono text-xs resize-none h-32"
                placeholder={'Paste QR payload JSON:\n{"certificateId":"CERT-...","hash":"..."}'}
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
              />
              <Button onClick={handleVerify} loading={loading} className="w-full" size="lg">
                <QrCode className="w-4 h-4" /> Verify QR
              </Button>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">How it works</p>
              <h3 className="font-display font-semibold text-slate-200 mt-1">Verification Steps</h3>
            </div>
            <div className="space-y-3 text-sm">
              {[
                'Choose a method: ID, file, or QR payload.',
                'We run OCR + database cross-checks.',
                'Blockchain hashes are compared when available.',
              ].map((t, i) => (
                <div key={t} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-ink-800 border border-ink-700 text-xs font-mono flex items-center justify-center text-slate-400">
                    {i + 1}
                  </span>
                  <p className="text-slate-500">{t}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-ink-700 bg-ink-900/60 p-4">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Tip</p>
              <p className="text-slate-400 text-sm mt-1">
                QR checks are fastest. Scan the QR from a certificate and paste the JSON payload here.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {loading && (
        <Card className="flex items-center justify-center py-12 gap-4">
          <Spinner size="lg" />
          <div>
            <p className="font-display font-semibold text-slate-200">Analyzing certificate...</p>
            <p className="text-slate-500 text-sm">Running OCR, database check, and blockchain validation</p>
          </div>
        </Card>
      )}

      {result && !loading && cfg && (
        <div className="space-y-4 animate-fade-up">
          <Card className={`border ${cfg.bg} relative overflow-hidden`}>
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-slate-400/5 blur-2xl" />
            <div className="flex items-start gap-5 relative">
              <div className={`p-4 rounded-2xl ${cfg.bg}`}>
                <ResultIcon className={`w-8 h-8 ${cfg.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className={`font-display text-2xl font-bold ${cfg.color}`}>{cfg.label}</h2>
                  <span className="font-mono text-slate-500 text-sm">
                    Confidence: <span className="text-slate-300">{result.confidenceScore}%</span>
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{cfg.tagline}</p>

                <div className="mt-4">
                  <div className="w-full h-2 rounded-full bg-ink-800 overflow-hidden">
                    <div
                      className={`h-full ${confidenceColor}`}
                      style={{ width: `${Math.min(100, result.confidenceScore || 0)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-mono">Confidence meter</p>
                </div>

                <div className="flex gap-3 mt-4">
                  <span className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full ${result.databaseMatched ? 'bg-jade-400/10 text-jade-400' : 'bg-slate-400/10 text-slate-400'}`}>
                    <ShieldCheck className="w-3 h-3" />
                    {result.databaseMatched ? 'DB Match' : 'Not in DB'}
                  </span>
                  <span className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full ${result.blockchainVerified ? 'bg-jade-400/10 text-jade-400' : 'bg-slate-400/10 text-slate-400'}`}>
                    <Hash className="w-3 h-3" />
                    {result.blockchainVerified ? 'Blockchain OK' : 'Blockchain -'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {result.certificate && (
            <Card>
              <h3 className="font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-jade-400" />
                Certificate Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  ['Student', result.certificate.studentName],
                  ['Roll No.', result.certificate.rollNumber],
                  ['Course', result.certificate.course],
                  ['Institution', result.certificate.institutionId?.name],
                  ['Issue Date', result.certificate.issueDate ? format(new Date(result.certificate.issueDate), 'dd MMM yyyy') : null],
                  ['Status', null, <Badge status={result.certificate.verificationStatus} />],
                ].map(([label, val, node]) => (
                  <div key={label}>
                    <p className="text-slate-600 text-xs font-mono uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-slate-200 font-display font-medium">{node || val || '-'}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.anomalies?.length > 0 && (
            <Card>
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setShowAnomalies(!showAnomalies)}
              >
                <h3 className="font-display font-semibold text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  {result.anomalies.length} Anomal{result.anomalies.length === 1 ? 'y' : 'ies'} Detected
                </h3>
                {showAnomalies ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {showAnomalies && (
                <div className="mt-4 space-y-2">
                  {result.anomalies.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-ink-800">
                      <Badge status={a.severity === 'critical' || a.severity === 'high' ? 'fake' : 'suspicious'} label={a.severity} />
                      <div>
                        <p className="text-slate-300 text-sm font-mono">{a.type?.replace(/_/g, ' ')}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{a.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {result.ocrData && (
            <Card>
              <h3 className="font-display font-semibold text-slate-400 text-sm mb-3 flex items-center gap-2">
                <Search className="w-3.5 h-3.5" /> OCR Extracted Data
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(result.ocrData)
                  .filter(([k, v]) => k !== 'extractedText' && v)
                  .map(([k, v]) => (
                    <div key={k} className="bg-ink-800 rounded-lg px-3 py-2">
                      <span className="text-slate-600">{k}: </span>
                      <span className="text-slate-300">{v}</span>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" onClick={() => setResult(null)} className="flex-1">
              Verify Another
            </Button>
            {(result.result === 'fake' || result.result === 'suspicious') && (
              <Button variant="danger" onClick={handleReportFraud}>
                <ShieldOff className="w-4 h-4" /> Report Fraud
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
