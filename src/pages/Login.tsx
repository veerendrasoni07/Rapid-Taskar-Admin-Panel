import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authServices';

export default function Login() {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState(''); // phone or email
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      await authService.sendOtp(identifier);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP');
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
      const res = await authService.verifyOtp(identifier, otp);
      if (res.success && res.data?.token) {
        if (res.data.user?.role !== 'ADMIN') {
          throw new Error('Access denied. This account does not have administrator privileges.');
        }
        setAuth(res.data.token, res.data.user);
        navigate('/');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-xl shadow-sm border border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">RapidTaskar</h1>
          <p className="text-secondary mt-2">Admin Portal Login</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-error/10 text-error rounded-md text-sm border border-error/20">
            {error}
          </div>
        )}
        
        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Phone Number or Email</label>
              <input 
                type="text"
                required
                className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
                placeholder="Enter admin email or phone..."
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-sm text-secondary text-center mb-4">
              OTP sent to <span className="font-medium text-text">{identifier}</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text mb-1">Enter OTP</label>
              <input 
                type="text"
                required
                maxLength={6}
                className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm text-center tracking-widest text-lg font-mono"
                placeholder="••••••"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || otp.length < 4}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button 
              type="button"
              onClick={() => {
                setStep(1);
                setOtp('');
                setError('');
              }}
              className="w-full text-center text-sm text-secondary hover:text-primary mt-2"
            >
              Back to start
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
