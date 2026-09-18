import React, { useState, useEffect } from 'react';
import { Building2, Save, CheckCircle2, ShieldCheck, Mail, Phone, MapPin, FileText, AlertCircle, RefreshCw, HardHat } from 'lucide-react';
import api from '../../services/api.ts';

export function CompanySettingsPage() {
  const [companyName, setCompanyName] = useState<string>('ARAMBH CONSTRUCTION');
  const [directorName, setDirectorName] = useState<string>('Er. Sudarshan Bajrang Naik');
  const [phone, setPhone] = useState<string>('+917796853434');
  const [email, setEmail] = useState<string>('arambhconstruction9977@gmail.com');
  const [gstin, setGstin] = useState<string>('27AAQFA4918L1Z8');
  const [address, setAddress] = useState<string>('At/Post Shengaon, Tal: Bhudargad, District: Kolhapur, PIN 416209');
  const [receiptPrefix, setReceiptPrefix] = useState<string>('ARAMBH-REC');
  const [voucherPrefix, setVoucherPrefix] = useState<string>('ARAMBH-VCH');

  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get('/admin/company-settings');
        if (res.data.success && res.data.data) {
          const s = res.data.data;
          if (s.companyName) setCompanyName(s.companyName);
          if (s.directorName) setDirectorName(s.directorName);
          if (s.phone) setPhone(s.phone);
          if (s.email) setEmail(s.email);
          if (s.gstin) setGstin(s.gstin);
          if (s.address) setAddress(s.address);
          if (s.receiptPrefix) setReceiptPrefix(s.receiptPrefix);
          if (s.voucherPrefix) setVoucherPrefix(s.voucherPrefix);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await api.put('/admin/company-settings', {
        companyName,
        directorName,
        phone,
        email,
        gstin,
        address,
        receiptPrefix,
        voucherPrefix,
      });

      if (res.data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save company settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to reset all data and refresh with pristine Arambh Construction records for Er. Sudarshan Bajrang Naik?')) {
      return;
    }
    setResetting(true);
    setResetSuccess('');
    setError('');
    try {
      const res = await api.post('/admin/company-settings/reset', {});
      if (res.data.success) {
        setResetSuccess(res.data.message || 'ERP successfully refreshed with fresh data.');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset database.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Enterprise Profile & Legal Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official government contractor profile for Er. Sudarshan Bajrang Naik.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetData}
          disabled={resetting}
          className="px-4 py-2 bg-slate-900 border border-amber-500/40 hover:bg-amber-500/10 text-amber-400 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shrink-0"
          title="Wipe and restore pristine initial data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Refreshing Database...' : 'Reset to Fresh Data'}</span>
        </button>
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{resetSuccess}</span>
        </div>
      )}

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Enterprise configuration updated and synchronized across all active site terminals and vouchers.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Official Brand Header Badge */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center gap-6">
        <img
          src="/logo.jpg"
          alt="|| आरंभ || कन्स्ट्रक्शन"
          referrerPolicy="no-referrer"
          className="h-20 w-auto object-contain rounded-xl border border-slate-700 bg-black shadow-lg"
        />
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-black uppercase tracking-widest bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded">
              PWD Class-A
            </span>
            <span className="text-xs font-bold text-amber-400">
              इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर
            </span>
          </div>
          <h2 className="text-xl font-black text-white">
            ARAMBH CONSTRUCTION
          </h2>
          <p className="text-sm font-semibold text-amber-300">
            Er. Sudarshan Bajrang Naik
          </p>
          <p className="text-xs text-slate-400">
            At/Post Shengaon, Tal: Bhudargad, District: Kolhapur, PIN 416209 • Contact: +91 7796853434
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Entity details */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Legal Contractor Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Enterprise Registered Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Director / Civil Engineer *</label>
              <input
                type="text"
                required
                value={directorName}
                onChange={(e) => setDirectorName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Official Contact Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Official Communication Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">GSTIN / Contractor Tax Registration</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="27AAQFA4918L1Z8"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contractor Class & Registration</label>
              <input
                type="text"
                readOnly
                value="PWD Maharashtra Class-A Civil Contractor"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-amber-400 font-semibold text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Official Registered Office Address *</label>
            <textarea
              rows={2}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Voucher & Receipt Series */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Document Numbering Sequences</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Client Receipt Prefix</label>
              <input
                type="text"
                value={receiptPrefix}
                onChange={(e) => setReceiptPrefix(e.target.value)}
                placeholder="ARAMBH-REC"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Generates e.g. ARAMBH-REC-2025-0001</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Expense Voucher Prefix</label>
              <input
                type="text"
                value={voucherPrefix}
                onChange={(e) => setVoucherPrefix(e.target.value)}
                placeholder="ARAMBH-VCH"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Generates e.g. ARAMBH-VCH-2025-0001</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
