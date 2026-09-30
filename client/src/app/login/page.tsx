'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useParking } from '../../context/ParkingContext';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Shield, UserCheck, CheckCircle2, Eye, EyeOff, Sparkles, Key, AlertCircle, ArrowRight, Zap } from 'lucide-react';

interface PresetAccount {
  id: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR';
  label: string;
  email: string;
  password: string;
}

const PRESET_ACCOUNTS: PresetAccount[] = [
  {
    id: 'superadmin',
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    email: 'superadmin@smartparking.io',
    password: 'password123',
  },
  {
    id: 'admin',
    role: 'ADMIN',
    label: 'Admin',
    email: 'admin@smartparking.io',
    password: 'password123',
  },
  {
    id: 'operator',
    role: 'OPERATOR',
    label: 'Operator',
    email: 'operator@smartparking.io',
    password: 'password123',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { loginUser, showToast } = useParking();

  const [email, setEmail] = useState('superadmin@smartparking.io');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('superadmin');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Inline field errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const clearErrors = () => {
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
  };

  const executeAuth = async (targetEmail: string, targetPass: string) => {
    clearErrors();
    setIsLoading(true);

    try {
      const res = await api.login({ email: targetEmail.trim(), password: targetPass.trim() });
      const user = res.user || res.data?.user;
      const token = res.token || res.data?.token;

      if (user) {
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('smart_parking_token', token);
        }
        loginUser(user);
        showToast('success', 'Authentication Successful', `Welcome back, ${user.name}`);
        router.push('/dashboard');
      } else {
        throw new Error('User profile was not returned from the server database.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const rawMsg: string = err.message || 'Invalid credentials.';
      const lower = rawMsg.toLowerCase();

      if (lower.includes('not found') || lower.includes('email') || lower.includes('user')) {
        setEmailError(rawMsg);
      } else if (lower.includes('password')) {
        setPasswordError(rawMsg);
      } else {
        setGeneralError(rawMsg);
      }

      showToast('error', 'Login Failed', rawMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    executeAuth(email, password);
  };

  const handleQuickFill = (acc: PresetAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedAccountId(acc.id);
    clearErrors();
  };

  return (
    <div className="w-full max-w-md lg:max-w-5xl rounded-3xl lg:rounded-[2.5rem] bg-white shadow-2xl shadow-black/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-auto lg:min-h-[640px] border border-slate-800/40 relative my-auto">
      {/* --- Left Hero Panel (Desktop / Tablet Large Only: Artwork & Quotes) --- */}
      <div className="hidden lg:flex lg:col-span-5 relative m-3 rounded-[2rem] overflow-hidden bg-black flex-col justify-between p-8 xl:p-10 min-h-[600px]">
        {/* Background Artwork */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/login-hero.jpg"
            alt="Neon Fluid Art"
            fill
            className="object-cover object-center opacity-85 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
        </div>

        {/* Top Tagline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold tracking-[0.25em] text-teal-300 uppercase">
              SMART PARKING IOT
            </span>
            <div className="h-[1px] w-14 bg-teal-400/40" />
          </div>
        </div>

        {/* Bottom Headline & Project Vision */}
        <div className="relative z-10 space-y-3">
          <h2 className="text-3xl xl:text-4xl font-serif text-white tracking-tight leading-[1.15]">
            Intelligent
            <br />
            Parking System
          </h2>
          <p className="text-xs xl:text-sm text-slate-200/90 font-light leading-relaxed max-w-sm">
            Real-time ultrasonic IoT telemetry, automated bay occupancy tracking, and seamless live facility navigation.
          </p>
        </div>
      </div>

      {/* --- Right Form Panel (Fully Responsive Mobile + Desktop) --- */}
      <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-between bg-white w-full">
        {/* Top Brand Header */}
        <div className="flex items-center justify-between sm:justify-end mb-4 sm:mb-6">
          <div className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80">
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>IoT Platform</span>
          </div>

          <div className="inline-flex items-center gap-2">
            
          </div>
        </div>

        {/* Center Content: Welcome Heading & Inputs */}
        <div className="max-w-md w-full mx-auto my-auto space-y-5 sm:space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-medium text-slate-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Enter your credentials to access the real-time console
            </p>
          </div>

          {generalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Email or Username</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setEmailError('');
                    setSelectedAccountId('');
                  }}
                  className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                    emailError
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/30'
                      : 'border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10'
                  }`}
                  required
                />
              </div>
              {emailError && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setPasswordError('');
                    setSelectedAccountId('');
                  }}
                  className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 pr-11 rounded-xl text-sm bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                    passwordError
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/30'
                      : 'border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* Remember Me & Pass Hint */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-800"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => showToast('info', 'Default Passwords', 'Database seeded password for all users is password123')}
                className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
              >
                Forgot Password
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-black hover:bg-slate-900 text-white font-semibold py-3 sm:py-3.5 rounded-xl shadow-md transition-all active:scale-[0.99] text-sm mt-1"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Auto-Fill Chips */}
          <div className="pt-3 sm:pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-slate-600" />
                Quick Auto-Fill
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Pass: password123</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {PRESET_ACCOUNTS.map(acc => {
                const isSelected = selectedAccountId === acc.id || email === acc.email;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickFill(acc)}
                    className={`py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1 sm:gap-1.5 border truncate ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {acc.role === 'SUPER_ADMIN' ? (
                      <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    ) : acc.role === 'ADMIN' ? (
                      <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    )}
                    <span className="truncate">{acc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="pt-3 sm:pt-4 text-center text-xs text-slate-500">
          <span>Return to </span>
          <a
            href="/"
            className="font-bold text-slate-900 hover:underline transition-colors"
          >
            Project Overview Home
          </a>
        </div>
      </div>
    </div>
  );
}
