import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { Lock, User, Eye, EyeOff, AlertCircle, Check, Loader2 } from 'lucide-react';
import AuthLayout from '../components/ui/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SecurityGraphic from '../components/ui/SecurityGraphic';

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('user_0');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        setSuccessMsg('Official account request submitted successfully. Please wait for departmental approval.');
        await new Promise((r) => setTimeout(r, 1200));
      } else {
        await login(username, password);
        setSuccessMsg('Authentication successful. Redirecting to secure workspace...');
        setTimeout(() => {
          navigate('/');
        }, 800);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify your official credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (demoUser: string) => {
    setUsername(demoUser);
    setPassword('password');
    setError('');
  };

  return (
    <AuthLayout graphic={<SecurityGraphic type={isSignUp ? 'signup' : 'login'} />}>
      <div className="w-full">
        {/* Logo/Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-lg bg-ksp-navy flex items-center justify-center text-white shadow-sm">
            <div className="w-6 h-6 border-2 border-ksp-gold rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-ksp-gold rounded-full" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-ksp-navy leading-none">
              KSP <span className="text-ksp-royal">Portal</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Secure Auth System
            </span>
          </div>
        </div>

        {/* Text Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-ksp-text tracking-tight">
            {isSignUp ? 'Official Registration' : 'Secure Login'}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {isSignUp
              ? 'Enter your official details to request access to the law enforcement portal.'
              : 'Enter your credentials to access the Karnataka State Police secure environment.'}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg flex items-start gap-3 animate-fadeIn">
            <AlertCircle size={18} className="mt-0.5 text-red-500 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-sm rounded-r-lg flex items-start gap-3 animate-fadeIn">
            <Check size={18} className="mt-0.5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label="Official Username"
            placeholder="Enter username or email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<User size={18} />}
            required
          />

          <div className="space-y-2">
            <Input
              label="Secure Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              required
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center gap-1 text-xs font-semibold transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              }
            />
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-ksp-navy focus:ring-ksp-navy accent-ksp-navy"
                />
                <span>Remember this device</span>
              </label>
              <button
                type="button"
                onClick={() => setError('Password recovery link has been dispatched to your registered official email.')}
                className="text-ksp-royal hover:text-ksp-navy font-bold transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            isLoading={loading}
          >
            {isSignUp ? 'Request Access' : 'Secure Sign In'}
          </Button>
        </form>

        {/* Demo Access */}
        <div className="mt-10 pt-6 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
            Authorized Demo Profiles
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'user_0', role: 'Supervisor' },
              { name: 'user_1', role: 'Investigator' },
              { name: 'user_2', role: 'Policymaker' },
              { name: 'user_9', role: 'Investigator' },
            ].map((demo) => (
              <button
                key={demo.name}
                type="button"
                onClick={() => handleQuickDemoFill(demo.name)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-ksp-bg border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:text-ksp-navy transition-all cursor-pointer"
              >
                {demo.name} <span className="text-slate-400 font-normal">({demo.role})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Switcher */}
        <div className="mt-8 text-center text-xs text-slate-500">
          {isSignUp ? (
            <p>
              Already authorized?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                }}
                className="text-ksp-royal font-bold hover:text-ksp-navy transition-all"
              >
                Return to Login
              </button>
            </p>
          ) : (
            <p>
              Need official access?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                }}
                className="text-ksp-royal font-bold hover:text-ksp-navy transition-all"
              >
                Request Account
              </button>
            </p>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
