import React, { useState } from 'react';
import { Smartphone, Lock, ShieldCheck, ArrowRight, UserPlus, KeyRound } from 'lucide-react';

interface PatientAuthProps {
  onSuccess: () => void;
}

export const PatientAuth: React.FC<PatientAuthProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'forgot'>('login');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [otp, setOtp] = useState(['4', '8', '2', '9']);

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login' || mode === 'register') {
      setMode('otp');
    } else if (mode === 'otp') {
      onSuccess();
    } else {
      setMode('login');
    }
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        
        {/* Top Glow Accent */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-healthcare-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-healthcare-100 dark:bg-healthcare-950 text-healthcare-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            {mode === 'otp' ? <ShieldCheck className="w-7 h-7" /> : <Smartphone className="w-7 h-7" />}
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Patient Account'}
            {mode === 'otp' && 'OTP Verification'}
            {mode === 'forgot' && 'Reset Password'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'otp' 
              ? `Enter the 4-digit code sent to ${phone}`
              : 'Secure access to multi-clinic queue & AI diagnostics'}
          </p>
        </div>

        <form onSubmit={handleAction} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                defaultValue="Aarav Sharma"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500"
                required
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500"
                  required
                />
              </div>
            </div>
          )}

          {mode === 'otp' && (
            <div className="flex justify-center space-x-3 my-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const newOtp = [...otp];
                    newOtp[idx] = e.target.value;
                    setOtp(newOtp);
                  }}
                  className="w-12 h-12 text-center text-xl font-bold rounded-xl border border-healthcare-300 dark:border-healthcare-700 bg-healthcare-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-healthcare-500"
                />
              ))}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-healthcare-500 hover:bg-healthcare-600 text-white font-bold text-sm shadow-floating transition-all flex items-center justify-center space-x-2"
          >
            <span>{mode === 'otp' ? 'Verify & Continue' : 'Send One-Time Password'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
          {mode === 'login' && (
            <>
              <p>Don't have an account? <button onClick={() => setMode('register')} className="text-healthcare-500 font-bold hover:underline">Register</button></p>
              <p><button onClick={() => setMode('forgot')} className="hover:underline">Forgot Password?</button></p>
            </>
          )}
          {mode === 'register' && (
            <p>Already registered? <button onClick={() => setMode('login')} className="text-healthcare-500 font-bold hover:underline">Sign In</button></p>
          )}
          {mode === 'otp' && (
            <p>Didn't receive code? <button onClick={() => setMode('otp')} className="text-healthcare-500 font-bold hover:underline">Resend OTP</button></p>
          )}
        </div>

      </div>
    </div>
  );
};
