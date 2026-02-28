'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useUserStore } from '@/stores/user';

type AuthMode = 'phone' | 'email';
type PhoneStep = 'input' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setPhone, setConfirmationResult, setLoading, isLoading } = useUserStore();
  const [authMode, setAuthMode] = useState<AuthMode>('phone');
  const [error, setError] = useState('');

  // Phone auth state
  const [phoneInput, setPhoneInput] = useState('+964');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('input');
  const [otpInput, setOtpInput] = useState('');
  const recaptchaRef = useRef<HTMLDivElement>(null);

  // Email auth state
  const [isSignUp, setIsSignUp] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const handleUserResult = async (firebaseUser: { uid: string; displayName: string | null; email: string | null; phoneNumber?: string | null; getIdToken: () => Promise<string> }) => {
    try {
      const token = await firebaseUser.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch { /* continue */ }

    setUser({
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || nameInput || '',
      phone: firebaseUser.phoneNumber || phoneInput || '',
      email: firebaseUser.email || emailInput || '',
      address: { formatted: '', lat: 0, lng: 0 },
      signupDate: new Date().toISOString(),
      totalOrders: 0,
      totalSpent: 0,
      referralCode: firebaseUser.uid.slice(0, 8).toUpperCase(),
      preferences: [],
      dietaryRestrictions: [],
      freeDeliveries: 4,
      hasSeenFreeDeliveryModal: false,
    });

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    router.push(redirect || '/onboarding');
  };

  // --- Phone Auth ---
  const handleSendOTP = async () => {
    if (phoneInput.length < 8) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const fb = await import('@/lib/firebase');
      const verifier = fb.setupRecaptcha('recaptcha-container');
      const confirmation = await fb.sendPhoneOTP(phoneInput, verifier);
      setPhone(phoneInput);
      setConfirmationResult(confirmation);
      setPhoneStep('otp');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      if (msg.includes('too-many-requests')) {
        setError('Too many attempts. Please try again later.');
      } else if (msg.includes('invalid-phone-number')) {
        setError('Invalid phone number format');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpInput.length < 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const confirmation = useUserStore.getState().confirmationResult as { confirm: (code: string) => Promise<{ user: { uid: string; displayName: string | null; email: string | null; phoneNumber: string | null; getIdToken: () => Promise<string> } }> } | null;
      if (!confirmation) throw new Error('No confirmation result');
      const result = await confirmation.confirm(otpInput);
      handleUserResult(result.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid code';
      if (msg.includes('invalid-verification-code')) {
        setError('Incorrect code. Please try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Email Auth ---
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) { setError('Please enter email and password'); return; }
    if (isSignUp && !nameInput) { setError('Please enter your name'); return; }
    if (passwordInput.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    try {
      const fb = await import('@/lib/firebase');
      const result = isSignUp
        ? await fb.signUpWithEmail(emailInput, passwordInput, nameInput)
        : await fb.signInWithEmail(emailInput, passwordInput);
      handleUserResult(result.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (msg.includes('email-already-in-use')) setError('Account already exists. Try signing in.');
      else if (msg.includes('user-not-found') || msg.includes('invalid-credential')) setError('Invalid email or password');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- Google Auth ---
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const fb = await import('@/lib/firebase');
      const result = await fb.signInWithGoogle();
      handleUserResult(result.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // --- Skip ---
  const handleSkip = () => {
    router.push('/');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary z-0" />
      <div className="absolute inset-0 z-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #111 1px, transparent 1px), radial-gradient(circle at 75% 75%, #111 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Recaptcha container (invisible) */}
      <div id="recaptcha-container" ref={recaptchaRef} />

      <div className="relative z-10 mb-8 text-center login-entrance">
        <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-md ring-4 ring-white/20">
          <Image src="/wadem-logo.png" alt="Wadem" width={80} height={80} className="w-full h-full object-contain" />
        </div>
        <h1 className="text-4xl font-extrabold text-secondary tracking-tight mb-1">Wadem</h1>
        <p className="text-secondary/60 text-sm">The food delivery app that&apos;s actually a food delivery app.</p>
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-4 login-entrance" style={{ animationDelay: '0.1s' }}>

        {/* Phone Auth (Primary) */}
        {authMode === 'phone' && (
          <div className="space-y-3">
            {phoneStep === 'input' ? (
              <>
                <Input
                  type="tel"
                  placeholder="+964 7XX XXX XXXX"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="bg-white shadow-sm text-base py-3.5"
                  autoFocus
                  error={error}
                />
                <Button fullWidth size="lg" onClick={handleSendOTP} loading={isLoading}>
                  Send Verification Code
                </Button>
              </>
            ) : (
              <>
                <p className="text-center text-sm text-secondary/70 mb-1">
                  Code sent to <span className="font-semibold text-secondary">{phoneInput}</span>
                </p>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-white shadow-sm text-base py-3.5 text-center tracking-[0.3em]"
                  autoFocus
                  error={error}
                />
                <Button fullWidth size="lg" onClick={handleVerifyOTP} loading={isLoading}>
                  Verify & Sign In
                </Button>
                <button
                  onClick={() => { setPhoneStep('input'); setOtpInput(''); setError(''); }}
                  className="w-full text-center text-sm text-secondary/70 hover:text-secondary py-1 transition-colors"
                >
                  ← Change number
                </button>
              </>
            )}
          </div>
        )}

        {/* Email Auth (Secondary) */}
        {authMode === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {isSignUp && (
              <Input type="text" placeholder="Your name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="bg-white shadow-sm text-base py-3.5" />
            )}
            <Input type="email" placeholder="Email address" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="bg-white shadow-sm text-base py-3.5" autoFocus />
            <Input type="password" placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} error={error} className="bg-white shadow-sm text-base py-3.5" />
            <Button type="submit" fullWidth size="lg" loading={isLoading}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="w-full text-center text-sm text-secondary/80 hover:text-secondary py-1 transition-colors">
              {isSignUp ? <>Already have an account? <span className="font-semibold underline">Sign in</span></> : <>Don&apos;t have an account? <span className="font-semibold underline">Sign up</span></>}
            </button>
          </form>
        )}

        {/* Toggle auth mode */}
        <button
          onClick={() => { setAuthMode(authMode === 'phone' ? 'email' : 'phone'); setError(''); }}
          className="w-full text-center text-sm text-secondary/60 hover:text-secondary py-1 transition-colors"
        >
          {authMode === 'phone' ? 'Use email instead' : 'Use phone number instead'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-secondary/25" />
          <span className="text-secondary/50 text-xs font-medium uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-secondary/25" />
        </div>

        {/* Google Sign In */}
        <Button variant="secondary" fullWidth size="lg" onClick={handleGoogleSignIn} loading={isLoading} className="bg-white shadow-sm hover:shadow-md text-secondary font-semibold">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="w-full text-center text-sm text-secondary/50 hover:text-secondary py-2 transition-colors"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}
