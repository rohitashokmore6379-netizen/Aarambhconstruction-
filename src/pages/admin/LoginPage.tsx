import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Key,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import api from '../../services/api.ts';
import {
  isWebAuthnSupported,
  base64urlToUint8Array,
  bufferToBase64url,
} from '../../utils/webauthn.ts';

export function LoginPage() {
  const [email, setEmail] = useState<string>('Sudarshan5353');
  const [password, setPassword] = useState<string>('Arambh5353');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Forgot Password Mode State
  const [isForgotMode, setIsForgotMode] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotId, setForgotId] = useState<string>('Sudarshan5353');
  const [recoveryData, setRecoveryData] = useState<{
    code?: string;
    maskedEmail?: string;
    maskedPhone?: string;
    username?: string;
    securityQuestion?: string;
    masterPin?: string;
  } | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string>('');

  const { login, setAuthSession } = useAuth();
  const navigate = useNavigate();

  // Biometric state
  const [bioLoading, setBioLoading] = useState<boolean>(false);
  const [bioError, setBioError] = useState<string>('');

  const handleBiometricLogin = async () => {
    setError('');
    setBioError('');
    setBioLoading(true);

    if (!isWebAuthnSupported()) {
      setBioError('Biometrics is not supported in this browser.');
      setBioLoading(false);
      return;
    }

    try {
      // 1. Fetch login challenge
      const identifier = (email || 'Sudarshan5353').trim();
      const optionsRes = await api.post('/auth/webauthn/login-options', {
        identifier,
      });

      if (!optionsRes.data.success) {
        throw new Error(optionsRes.data.message || 'Failed to initialize biometric challenge');
      }

      const opts = optionsRes.data.options;

      const allowCredentials = (opts.allowCredentials || []).map((cred: any) => ({
        id: base64urlToUint8Array(cred.id),
        type: cred.type,
        transports: cred.transports,
      }));

      // 2. Request assertion from device biometric sensor
      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge: base64urlToUint8Array(opts.challenge),
          rpId: window.location.hostname,
          allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
          userVerification: 'required',
          timeout: 60000,
        },
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Biometric verification cancelled.');
      }

      // 3. Verify on server
      const verifyRes = await api.post('/auth/webauthn/verify-login', {
        identifier,
        credentialId: credential.id,
      });

      if (verifyRes.data.success) {
        setAuthSession(verifyRes.data.token, verifyRes.data.user);
        navigate('/admin/dashboard');
      } else {
        setBioError(verifyRes.data.message || 'Biometric authentication failed');
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setBioError('Biometric verification was canceled or timed out.');
      } else {
        setBioError(
          err.response?.data?.message || err.message || 'Biometric verification failed'
        );
      }
    } finally {
      setBioLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
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
    setEmail('Sudarshan5353');
    setPassword('Arambh5353');
    setError('');
  };

  // Step 1: Request Recovery Code
  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotId.trim()) {
      setForgotError('Please enter your username or registered email.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/request', {
        identifier: forgotId.trim(),
      });

      if (res.data.success) {
        setRecoveryData(res.data);
        if (res.data.code) {
          setRecoveryCode(res.data.code);
        }
        setForgotStep(2);
      } else {
        setForgotError(res.data.message || 'Failed to locate user account.');
      }
    } catch (err: any) {
      setForgotError(
        err.response?.data?.message || err.message || 'Account not found. Please verify username/email.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Reset Password with OTP / Master PIN
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!recoveryCode.trim()) {
      setForgotError('Please enter the 6-digit verification code or Master PIN.');
      return;
    }

    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setForgotError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('New password and confirm password do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/reset', {
        identifier: forgotId.trim(),
        otp: recoveryCode.trim(),
        newPassword: newPassword.trim(),
      });

      if (res.data.success) {
        setSuccessMsg('Password reset successfully! You can now sign in with your new password.');
        setEmail(forgotId.trim());
        setPassword(newPassword.trim());
        setIsForgotMode(false);
        setForgotStep(1);
        setRecoveryData(null);
        setRecoveryCode('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setForgotError(res.data.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setForgotError(
        err.response?.data?.message || err.message || 'Invalid code or failed to reset password.'
      );
    } finally {
      setForgotLoading(false);
    }
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

        {/* Global Success Notification */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Dynamic Card: LOGIN vs FORGOT PASSWORD */}
        {!isForgotMode ? (
          /* ========================================== */
          /* 1. STANDARD LOGIN CARD */
          /* ========================================== */
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

            {bioError && (
              <div className="p-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                <Fingerprint className="w-4 h-4 shrink-0" />
                <span>{bioError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Sudarshan5353 or admin@arambh.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold">Password</label>
                  {/* FORGOT PASSWORD TRIGGER */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setForgotStep(1);
                      setForgotId(email || 'Sudarshan5353');
                      setForgotError('');
                      setError('');
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold hover:underline transition-colors text-[11px] flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Forgot Password?</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                  Or Biometric Access
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Biometrics Login Button (Fingerprint / Face ID) */}
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={bioLoading}
                className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800/80 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 font-bold rounded-xl shadow-lg shadow-emerald-500/5 text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {bioLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Scanning Fingerprint / Face ID...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    <span>Sign In with Device Biometrics</span>
                  </>
                )}
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
                <span>Fill Default Credentials (Sudarshan5353)</span>
              </button>
              <p className="text-[11px] text-slate-500">
                You can easily change your username & password inside Company Settings after login.
              </p>
            </div>
          </div>
        ) : (
          /* ========================================== */
          /* 2. FORGOT / RESET PASSWORD CARD */
          /* ========================================== */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsForgotMode(false);
                  setForgotError('');
                }}
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                Step {forgotStep} of 2
              </span>
            </div>

            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <span>Reset Admin Password</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {forgotStep === 1
                  ? 'Enter your admin username or email to generate an instant recovery code.'
                  : 'Enter the verification code or Master PIN and create your new password.'}
              </p>
            </div>

            {forgotError && (
              <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* STEP 1: Enter Username/Email */}
            {forgotStep === 1 ? (
              <form onSubmit={handleRequestRecovery} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Admin Username or Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={forgotId}
                      onChange={(e) => setForgotId(e.target.value)}
                      placeholder="e.g. Sudarshan5353 or arambhconstruction9977@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Instant Recovery Guarantee</span>
                  </div>
                  <p>
                    A secure 6-digit code will be generated on screen. You can also use the Master Security PIN <strong className="text-white">5353</strong> directly.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Recovery Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: Verify Code and Set New Password */
              <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                {/* Visual helper badge with generated code */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300">
                      Target Account: <strong className="text-white">{recoveryData?.username || forgotId}</strong>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400">Recovery Verification Code:</div>
                      <div className="text-base font-black font-mono tracking-widest text-amber-400">
                        {recoveryData?.code || '5353'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRecoveryCode(recoveryData?.code || '5353')}
                      className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors"
                    >
                      Autofill Code
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Or Master Admin PIN: <strong className="text-amber-300 font-mono">5353</strong></span>
                    {recoveryData?.maskedEmail && (
                      <span>Email: {recoveryData.maskedEmail}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    6-Digit Verification Code or PIN *
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="e.g. 123456 or 5353"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono tracking-wider focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 4 chars)"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-1/3 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-2/3 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Reset & Sign In</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

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
export default LoginPage;
