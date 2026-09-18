import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Building2, ArrowRight, ShieldCheck, Key, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export function LoginPage() {
  const [email, setEmail] = useState<string>('admin@arambh.com');
  const [password, setPassword] = useState<string>('Admin@123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    if (res.success) {
      navigate('/admin/dashboard');
    } else {
      setError(res.message || 'Invalid administrative credentials');
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@arambh.com');
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-black border border-slate-800 shadow-xl shadow-amber-500/20 mb-2">
            <img
              src="/logo.jpg"
              alt="|| आरंभ || कन्स्ट्रक्शन"
              referrerPolicy="no-referrer"
              className="h-16 w-auto object-contain rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            ARAMBH <span className="text-amber-400">CONSTRUCTION</span>
          </h1>
          <div className="text-xs font-bold text-amber-300">
            Er. Sudarshan Bajrang Naik • इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर
          </div>
          <p className="text-[11px] text-slate-400">
            Enterprise Civil ERP & Financial Management Suite • Shengaon, Kolhapur
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Admin Authentication
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Secure 256-Bit
            </span>
          </div>

          {error && (
            <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Official Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@arambh.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In To ERP Suite'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Seed Credentials Quick Button */}
          <div className="pt-4 border-t border-slate-800 text-center space-y-2">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Fill Seed Admin Credentials (admin@arambh.com)</span>
            </button>
            <p className="text-[11px] text-slate-500">
              Demo access pre-loaded with live project data & financial records.
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-amber-400 transition-colors"
          >
            ← Return to Arambh Public Portal
          </a>
        </div>
      </div>
    </div>
  );
}
