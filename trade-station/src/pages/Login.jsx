import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gcLogo from '../assets/pics/greencdl.png';

/* ── small Google G SVG ─────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.3 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.5 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.3 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.8-3.6-11.3-8.5L6 32.3C9.5 38.9 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C43.1 35.9 44 30.3 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg>
);

/* ── Eye icons ───────────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17.9 17.9A10.9 10.9 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.1-6.9M9.9 4.2A10.1 10.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.6M1 1l22 22"/>
  </svg>
);

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();

  const [mode,       setMode]       = useState('login');   // 'login' | 'signup'
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [name,       setName]       = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState('');
  const [busy,       setBusy]       = useState(false);

  const clearErr = () => setError('');

  /* ── friendly Firebase error messages ── */
  const friendly = (code) => {
    if (!code) return 'Something went wrong.';
    if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Incorrect email or password.';
    if (code.includes('user-not-found'))    return 'No account found with this email.';
    if (code.includes('email-already'))     return 'An account already exists with this email.';
    if (code.includes('weak-password'))     return 'Password must be at least 6 characters.';
    if (code.includes('invalid-email'))     return 'Please enter a valid email address.';
    if (code.includes('popup-closed'))      return 'Sign-in popup was closed. Try again.';
    if (code.includes('network-request'))   return 'Network error. Check your connection.';
    return 'Authentication failed. Please try again.';
  };

  const handleGoogle = async () => {
    setBusy(true); clearErr();
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (e) {
      setError(friendly(e.code));
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setBusy(true); clearErr();
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
      navigate('/');
    } catch (err) {
      setError(friendly(err.code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020204] flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[30%] w-[600px] h-[600px] rounded-full bg-emerald-600/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[120px]" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[400px]">

        {/* Logo + brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-[#0c0c10] border border-[#1a1a22] shadow-xl">
            <img src={gcLogo} alt="GreenCandle" className="w-10 h-10 object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">GreenCandle</h1>
            <p className="text-[13px] text-[#55556a] mt-1">
              {mode === 'login' ? 'Sign in to your trading dashboard' : 'Create your trading account'}
            </p>
          </div>
        </div>

        {/* Glass card */}
        <div className="bg-[#0a0a0f]/90 border border-[#1a1a25] rounded-2xl p-8 shadow-2xl backdrop-blur-sm">

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2 bg-red-500/10 border border-red-500/25 rounded-lg px-4 py-3 text-sm text-red-400 animate-fade-in">
              <span className="text-red-500 mt-0.5">⚠</span>
              {error}
            </div>
          )}

          {/* Google sign-in */}
          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-[#1a1a1a] font-semibold text-sm py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 mb-5"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#1e1e2a]" />
            <span className="text-[11px] text-[#44445a] uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-[#1e1e2a]" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmail} className="flex flex-col gap-4">

            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#55556a] font-semibold uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => { setName(e.target.value); clearErr(); }}
                  placeholder="Your name"
                  className="bg-[#0f0f16] border border-[#222230] hover:border-[#333345] focus:border-blue-500/60 outline-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#33334a] transition-colors"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#55556a] font-semibold uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); clearErr(); }}
                placeholder="you@example.com"
                className="bg-[#0f0f16] border border-[#222230] hover:border-[#333345] focus:border-blue-500/60 outline-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#33334a] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#55556a] font-semibold uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearErr(); }}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                  className="w-full bg-[#0f0f16] border border-[#222230] hover:border-[#333345] focus:border-blue-500/60 outline-none rounded-xl px-4 py-2.5 pr-11 text-sm text-white placeholder-[#33334a] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#44445a] hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-1 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/30 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-[12px] text-[#44445a] mt-6">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); clearErr(); }}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#2a2a38] mt-6">
          Virtual trading platform — no real money involved
        </p>
      </div>
    </div>
  );
}
