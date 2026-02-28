import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/UI';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      // Route by role
      if (user.role === 'admin')       navigate('/admin');
      else if (user.role === 'institution') navigate('/dashboard');
      else                             navigate('/verify');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 bg-grid-ink bg-grid flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-jade-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-jade-500/15 border border-jade-500/30 flex items-center justify-center mb-4 animate-pulse-glow">
            <ShieldCheck className="w-7 h-7 text-jade-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-100">HealBharat</h1>
          <p className="text-slate-500 text-sm font-mono mt-1">Academic Certificate Validator</p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8 space-y-5">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-slate-100">Sign in</h2>
            <p className="text-slate-500 text-sm">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@institution.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-display text-slate-400">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-ink-800 border border-ink-600 focus:border-jade-500/50 text-slate-200 placeholder-slate-600 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors pr-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-jade-400 hover:text-jade-300 font-mono">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <p className="text-center text-slate-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-jade-400 hover:text-jade-300 font-display font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}