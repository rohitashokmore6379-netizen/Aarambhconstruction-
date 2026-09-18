import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Save,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  RefreshCw,
  HardHat,
  Key,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  Fingerprint,
} from 'lucide-react';
import api from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export function CompanySettingsPage() {
  const { user, updateCurrentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'company' | 'credentials'
  const initialTab = searchParams.get('tab') === 'security' || searchParams.get('tab') === 'credentials' ? 'credentials' : 'company';
  const [activeTab, setActiveTab] = useState<'company' | 'credentials'>(initialTab);

  // 1. Company Profile State
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

  // 2. Admin Credentials (Username & Profile) State
  const [adminUsername, setAdminUsername] = useState<string>(user?.username || 'Sudarshan5353');
  const [adminName, setAdminName] = useState<string>(user?.name || 'Er. Sudarshan Bajrang Naik');
  const [adminEmail, setAdminEmail] = useState<string>(user?.email || 'arambhconstruction9977@gmail.com');
  const [adminPhone, setAdminPhone] = useState<string>(user?.phone || '+917796853434');
  const [securityAnswer, setSecurityAnswer] = useState<string>('5353');
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileSaved, setProfileSaved] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string>('');

  // 3. Admin Password State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordSaving, setPasswordSaving] = useState<boolean>(false);
  const [passwordSaved, setPasswordSaved] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');

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

  // Sync user context when available
  useEffect(() => {
    if (user) {
      if (user.username) setAdminUsername(user.username);
      if (user.name) setAdminName(user.name);
      if (user.email) setAdminEmail(user.email);
      if (user.phone) setAdminPhone(user.phone);
    }
  }, [user]);

  const handleSaveCompany = async (e: React.FormEvent) => {
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

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileSaved(false);

    try {
      const res = await api.put('/admin/profile', {
        username: adminUsername.trim(),
        name: adminName.trim(),
        email: adminEmail.trim(),
        phone: adminPhone.trim(),
        securityQuestion: 'Primary Master Security PIN',
        securityAnswer: securityAnswer.trim(),
      });

      if (res.data.success) {
        setProfileSaved(true);
        updateCurrentUser({
          username: adminUsername.trim(),
          name: adminName.trim(),
          email: adminEmail.trim(),
          phone: adminPhone.trim(),
        });
        setTimeout(() => setProfileSaved(false), 4000);
      } else {
        setProfileError(res.data.message || 'Failed to update username/profile.');
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to update username/profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSaved(false);

    if (newPassword.trim().length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      setPasswordSaving(false);
      return;
    }

    try {
      const res = await api.put('/admin/change-password', {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      if (res.data.success) {
        setPasswordSaved(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSaved(false), 4000);
      } else {
        setPasswordError(res.data.message || 'Failed to change password.');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
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
            Enterprise & Admin Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Contractor business legal profile, official PWD credentials, and administrator login security.
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

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 rounded-2xl gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('company');
            setSearchParams({});
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'company'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Enterprise & Contractor Profile</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('credentials');
            setSearchParams({ tab: 'security' });
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'credentials'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Admin Username & Password</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300">
            Security
          </span>
        </button>
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: COMPANY & CONTRACTOR PROFILE                       */}
      {/* ========================================================= */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          {saved && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Enterprise configuration updated and synchronized across all terminals and vouchers.</span>
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

          <form onSubmit={handleSaveCompany} className="space-y-6 text-xs">
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
                <span>{saving ? 'Saving...' : 'Save Company Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ADMIN CREDENTIALS & SECURITY (USERNAME & PASSWORD)  */}
      {/* ========================================================= */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          {/* Identity Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Fingerprint className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">Administrator Credentials</h2>
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                    SUPERADMIN
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Current Login Username: <strong className="text-white font-mono">{user?.username || adminUsername}</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  Password changes take effect immediately on next login.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. CHANGE USERNAME & ADMIN IDENTITY */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-amber-400" />
                  <span>Change Admin Username</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Modify the username you use to log into the ERP.
                </p>
              </div>

              {profileSaved && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Username and profile successfully updated!</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateAdminProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Login Username *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="e.g. Sudarshan5353"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Default: <strong className="text-amber-400">Sudarshan5353</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Admin Notification Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Official Mobile / Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Master Recovery Security PIN
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      placeholder="5353"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Master PIN allows instant recovery in Forgot Password if phone/email is inaccessible.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {profileSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Username...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Update Username & Details</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* 2. CHANGE ADMIN PASSWORD */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Change Admin Password</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Set a new, secure administrative password.
                </p>
              </div>

              {passwordSaved && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Admin password successfully changed!</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Current Password (Optional if currently logged in)
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password or leave blank"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">New Password *</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter at least 4 characters"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Password validation helper */}
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Security Tips</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                    <li>Minimum 4 characters required.</li>
                    <li>Default admin password is <strong className="text-white font-mono">Arambh5353</strong>.</li>
                    <li>If you ever forget it, use the "Forgot Password?" option on the login screen.</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {passwordSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" />
                        <span>Change Password Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanySettingsPage;
