import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authServices';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';

export default function Login() {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState(''); // phone or email
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV || import.meta.env.VITE_SKIP_AUTH === 'true';

  useEffect(() => {
    if (isDev) {
      setAuth('dev-mock-admin-token', {
        _id: '000000000000000000000001',
        name: 'Dev Admin',
        role: 'ADMIN',
        phone: '+919999999999',
      });
      navigate('/', { replace: true });
    }
  }, [isDev, navigate, setAuth]);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const resetRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {
        // ignore
      }
      recaptchaVerifierRef.current = null;
    }
    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
    }
  };

  useEffect(() => {
    return () => {
      resetRecaptcha();
    };
  }, []);

  const formatPhoneNumber = (input: string): string => {
    const cleaned = input.trim().replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    // Default to +91 if 10-digit Indian phone number
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    return `+${cleaned}`;
  };

  const getRecaptchaVerifier = (): RecaptchaVerifier => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
    }

    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        setError('reCAPTCHA expired. Please try again.');
        resetRecaptcha();
      },
    });

    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  const handleSendOtp = async (e: React.FormEvent, forceBackend: boolean = false) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) return;

    setLoading(true);
    setError('');
    setInfoMessage('');

    // If explicit backend requested or is an email
    if (forceBackend || cleanId.includes('@')) {
      try {
        await authService.sendOtp(cleanId);
        setConfirmationResult(null);
        setStep(2);
        setCountdown(60);
        setInfoMessage('OTP generated via backend. Check backend terminal console for code.');
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to send OTP');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Try Firebase Phone OTP
    try {
      const formattedPhone = formatPhoneNumber(cleanId);
      const appVerifier = getRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep(2);
      setCountdown(60);
      setInfoMessage('Firebase SMS OTP sent to your phone.');
    } catch (err: any) {
      console.warn('[AUTH_FIREBASE_ERROR]', err);
      resetRecaptcha();

      // Check if Firebase rejected due to Billing (Spark plan), SMS Region policy, or Phone Auth not enabled
      const shouldFallbackToBackend = 
        err.code === 'auth/billing-not-enabled' ||
        err.code === 'auth/operation-not-allowed' || 
        err.message?.includes('billing-not-enabled') ||
        err.message?.includes('region enabled') ||
        err.message?.includes('operation-not-allowed');

      if (shouldFallbackToBackend) {
        console.info('[AUTH] Firebase SMS unavailable (' + (err.code || err.message) + '). Automatically falling back to backend OTP...');
        try {
          await authService.sendOtp(cleanId);
          setConfirmationResult(null);
          setStep(2);
          setCountdown(60);
          setInfoMessage(
            err.code === 'auth/billing-not-enabled' || err.message?.includes('billing-not-enabled')
              ? '💡 Firebase project is on the Spark (Free) plan which requires Blaze plan for real SMS. Switched to backend OTP (check backend terminal console for code).'
              : '⚠️ Firebase SMS Region is disabled in your Firebase Console. Switched to backend OTP (check backend terminal console).'
          );
          return;
        } catch (backendErr: any) {
          setError(backendErr.response?.data?.message || backendErr.message || 'Failed to send fallback OTP');
          return;
        }
      }

      if (err.code === 'auth/invalid-phone-number') {
        setError('Please enter a valid phone number with country code (e.g. +91 9876543210)');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few moments and try again.');
      } else if (err.code === 'auth/quota-exceeded') {
        setError('SMS quota exceeded for Firebase project. Please contact administrator.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to send OTP verification code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setLoading(true);
    setError('');

    try {
      if (confirmationResult) {
        // Verify via Firebase OTP
        const userCredential = await confirmationResult.confirm(otp.trim());
        const idToken = await userCredential.user.getIdToken();

        // Verify Firebase Token with Backend
        const res = await authService.verifyFirebaseOtp(idToken, formatPhoneNumber(identifier));
        if (res.success && res.data?.token) {
          if (res.data.user?.role !== 'ADMIN') {
            throw new Error('Access denied. This account does not have administrator privileges.');
          }
          setAuth(res.data.token, res.data.user);
          navigate('/');
        } else {
          throw new Error('Invalid response from server');
        }
      } else {
        // Verify via Backend OTP
        const res = await authService.verifyOtp(identifier, otp.trim());
        if (res.success && res.data?.token) {
          if (res.data.user?.role !== 'ADMIN') {
            throw new Error('Access denied. This account does not have administrator privileges.');
          }
          setAuth(res.data.token, res.data.user);
          navigate('/');
        } else {
          throw new Error('Invalid response from server');
        }
      }
    } catch (err: any) {
      console.error('[VERIFY_ERROR]', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP code. Please check and enter the correct 6-digit code.');
      } else if (err.code === 'auth/code-expired') {
        setError('OTP code has expired. Please request a new OTP.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to verify OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setOtp('');
    await handleSendOtp({ preventDefault: () => {} } as any, !confirmationResult);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div id="recaptcha-container"></div>
      <div className="w-full max-w-md bg-surface p-8 rounded-xl shadow-sm border border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">RapidTaskar</h1>
          <p className="text-secondary mt-2">Admin Portal Login</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Firebase OTP Verification
          </div>
        </div>

        {infoMessage && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md text-xs border border-blue-200">
            {infoMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-error/10 text-error rounded-md text-sm border border-error/20">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={(e) => handleSendOtp(e, false)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Admin Mobile Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full rounded-md border-0 py-2.5 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
                  placeholder="e.g. 9876543210 or +91 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
              <p className="text-xs text-secondary mt-1.5">
                Enter your mobile number to receive a 6-digit verification code.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sending Firebase OTP...' : 'Send Firebase OTP'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                disabled={loading || !identifier.trim()}
                onClick={(e) => handleSendOtp(e, true)}
                className="text-xs text-secondary hover:text-primary underline transition-colors"
              >
                Send via Backend Console (Dev Mode)
              </button>
            </div>

            {isDev && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuth('dev-mock-admin-token', {
                      _id: '000000000000000000000001',
                      name: 'Dev Admin',
                      role: 'ADMIN',
                      phone: '+919999999999',
                    });
                    navigate('/');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 border border-amber-200 transition-colors"
                >
                  ⚡ Skip Login (Dev Mode)
                </button>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-sm text-secondary text-center mb-4">
              Enter the 6-digit code sent to{' '}
              <span className="font-semibold text-text">{identifier}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Enter OTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                className="w-full rounded-md border-0 py-2.5 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm text-center tracking-widest text-xl font-mono font-bold"
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying OTP...' : 'Verify & Login'}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                  setInfoMessage('');
                  setConfirmationResult(null);
                  resetRecaptcha();
                }}
                className="text-xs text-secondary hover:text-primary transition-colors"
              >
                ← Change number
              </button>

              <button
                type="button"
                disabled={countdown > 0 || loading}
                onClick={handleResendOtp}
                className="text-xs font-medium text-primary hover:underline disabled:text-secondary disabled:no-underline"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
