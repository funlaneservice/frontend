'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/api';
import { IconLock, IconArrowLeft, IconArrowRight, IconEye, IconEyeOff } from '@/components/ui';
import { Check } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { toast } from 'react-toastify';
import { validateSchema } from '@/lib/validation/validate';
import { resetPasswordSchema } from '@/lib/validation/schemas';

export function ResetPasswordContainer() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token'));
  }, []);

  function strength(): { label: string; color: string; width: string } {
    if (password.length < 4) return { label: 'Too short', color: 'bg-red', width: 'w-1/4' };
    if (password.length < 8) return { label: 'Weak', color: 'bg-amber', width: 'w-2/4' };
    if (/(?=.*[A-Z])(?=.*\d)/.test(password)) return { label: 'Strong', color: 'bg-green', width: 'w-full' };
    return { label: 'Medium', color: 'bg-amber', width: 'w-3/4' };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('This reset link is invalid or incomplete. Please request a new one.');
      return;
    }
    const { errors: invalid } = await validateSchema(resetPasswordSchema, { password, confirm });
    if (invalid) {
      setError(invalid.password ?? invalid.confirm ?? 'Please check your password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await resetPassword(token, password);

      toast.success(response.message);

      const loginRoute =
        response.role === 'ADMIN'
          ? '/admin/login'
          : response.role === 'AGENT'
            ? '/agent/login'
            : '/login';

      router.push(loginRoute);
      setDone(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not reset your password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const s = strength();

  return (
    <AuthLayout title='New Security, New Strength.' description='The gold standard in corporate travel and logistics. Your precision-engineered portal ensures every movement is managed with absolute transparency.'>
      {/* Form panel */}
      <div>
        {done ? (
          <div className="text-center">
            <div aria-hidden="true" className="w-14 h-14 rounded-full bg-green-soft text-green flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-ink mb-2">Password reset</h1>
            <p className="text-ink-3 text-sm mb-6 leading-relaxed">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <button onClick={() => router.push('/login')} className="auth-btn">
              Go to sign in
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ink mb-2">Reset password</h1>
            <p className="text-ink-3 text-sm mb-6 leading-relaxed">Choose a strong new password for your account.</p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-ink mb-1.5">New password</label>
                <div className="relative">
                  <IconLock className="w-5 h-5 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="new-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter new password"
                    className="auth-field pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-ink hover:bg-surface transition-colors"
                  >
                    {showPw ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-line rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} ${s.width} rounded-full transition-all duration-300`} />
                    </div>
                    <div className="text-xs text-ink-3 mt-1">{s.label}</div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-ink mb-1.5">Confirm password</label>
                <div className="relative">
                  <IconLock className="w-5 h-5 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="confirm-password"
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      setError('');
                    }}
                    placeholder="Confirm new password"
                    className="auth-field"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-soft text-red-dark rounded-lg px-4 py-3 text-sm font-medium animate-slide-up">{error}</div>
              )}

              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? 'Resetting…' : 'Reset password'}
                {!loading && <IconArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm text-ink-3 hover:text-ink font-medium transition-colors"
            >
              <IconArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
