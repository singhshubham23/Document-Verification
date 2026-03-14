
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { Button, Input } from '../components/UI';
import { ShieldCheck, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'verifier',
    institutionName: '',   // ← new field
  });

  const handleRegister = async (e) => {
    e.preventDefault();

    // Client-side guard — institutionName required when role is institution
    if (form.role === 'institution' && !form.institutionName.trim()) {
      toast.error('Institution name is required');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.register(form);
      setUserId(res.data.userId);
      setStep('otp');
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.verifyOTP({ userId, otp });
      toast.success('Email verified! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const f = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="min-h-screen bg-ink-950 bg-grid-ink bg-grid flex items-center justify-center p-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-jade-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-jade-500/15 border border-jade-500/30 flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-jade-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-100">HealBharat</h1>
          <p className="text-slate-500 text-sm font-mono mt-1">Create your account</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {step === 'form' ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-slate-100 mb-1">Register</h2>

              <Input label="Full Name" placeholder="Sr" required {...f('name')} />
              <Input label="Email" type="email" placeholder="you@example.com" required {...f('email')} />
              <Input label="Phone" type="tel" placeholder="+91 XXXXX XXXXX" {...f('phone')} />
              <Input label="Password" type="password" placeholder="Min 6 characters" required {...f('password')} />

              {/* Role selector */}
              <div className="space-y-1.5">
                <label className="block text-sm font-display text-slate-400">Role</label>
                <select
                  className="w-full bg-ink-800 border border-ink-600 focus:border-jade-500/50 text-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value, institutionName: '' })}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="verifier" className="bg-[#1e293b] text-slate-200">Verifier</option>
                  <option value="institution" className="bg-[#1e293b] text-slate-200">Institution</option>
                </select>
              </div>

              {/* Institution name — only shown when role is institution */}
              {form.role === 'institution' && (
                <div className="space-y-1.5 animate-fade-up">
                  <label className="block text-sm font-display text-slate-400 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-jade-400" />
                    Institution Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    className="w-full bg-ink-800 border border-jade-500/30 focus:border-jade-500/70 text-slate-200 placeholder-slate-600 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                    placeholder=""
                    value={form.institutionName}
                    onChange={(e) => setForm({ ...form, institutionName: e.target.value })}
                    required={form.role === 'institution'}
                  />
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                Create Account
              </Button>

              <p className="text-center text-slate-500 text-sm pt-2">
                Already have an account?{' '}
                <Link to="/login" className="text-jade-400 hover:text-jade-300 font-display font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          ) : (
            /* OTP step */
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-100 mb-1">Verify Email</h2>
                <p className="text-slate-500 text-sm">
                  Enter the 6-digit OTP sent to{' '}
                  <span className="text-jade-400">{form.email}</span>
                </p>
              </div>

              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                className="w-full bg-ink-800 border border-ink-600 focus:border-jade-500/50 text-slate-100 text-center text-3xl font-mono tracking-[0.5em] rounded-xl px-4 py-4 outline-none transition-colors"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Verify OTP
              </Button>

              <p className="text-center text-slate-500 text-sm">
                Didn't receive it?{' '}
                <button
                  type="button"
                  className="text-jade-400 hover:text-jade-300 font-display font-medium"
                  onClick={() => toast('Please check your spam folder or re-register.')}
                >
                  Resend OTP
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
