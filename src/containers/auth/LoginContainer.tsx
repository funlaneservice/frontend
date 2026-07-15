'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Formik, Form } from 'formik';
import type { Role } from '@/interface';
import { useAuth } from '@/hooks/useAuth';
import { useHydration } from '@/hooks/useHydration';
import { homePathFor } from '@/services/auth.service';
import { IconShield } from '@/components/ui/icons';
import { Mail, Lock, AlertTriangle } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { GoogleAuthLink } from '@/components/auth/GoogleAuthLink';
import { TextField, CheckboxField } from '@/components/form';
import { loginSchema } from '@/lib/validation/schemas';
import { getRememberedEmail, rememberEmail, forgetEmail } from '@/lib/rememberMe';

interface LoginValues {
  email: string;
  password: string;
  remember: boolean;
}

export function LoginContainer() {
  const { user, signIn, loading, error } = useAuth();
  const hydrated = useHydration();
  const router = useRouter();

  const [role] = useState<Role>('client');
  const [initialValues] = useState<LoginValues>(() => ({
    email: getRememberedEmail(),
    password: '',
    remember: Boolean(getRememberedEmail()),
  }));

  useEffect(() => {
    if (hydrated && user) router.replace(homePathFor(user.role));
  }, [hydrated, user, router]);

  async function onSubmit(values: LoginValues) {
    if (values.remember) rememberEmail(values.email.trim());
    else forgetEmail();
    await signIn({ email: values.email, password: values.password, role });
  }

  return (
    <AuthLayout title="Streamlining Global Journeys."
      description="The gold standard in corporate travel and logistics. Your precision-engineered portal ensures every movement is managed with absolute transparency.">
      <h1 className="text-2xl font-bold text-ink mb-1.5">Welcome back</h1>
      <p className="text-ink-3 text-sm mb-6">Enter your credentials to access your secure dashboard.</p>

      <Formik initialValues={initialValues} validationSchema={loginSchema} onSubmit={onSubmit}>
        <Form noValidate className="space-y-4">
          <TextField
            name="email"
            type="email"
            label="Email address"
            placeholder="name@company.com"
            icon={Mail}
            autoComplete="email"
            id="login-email"
          />

          <div>
            <TextField
              name="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              icon={Lock}
              autoComplete="current-password"
              id="login-password"
              hint={
                <Link href="/forgot-password" className="text-xs font-medium text-sky-600 hover:underline">
                  Forgot password?
                </Link>
              }
            />
            <CheckboxField name="remember" className="mt-3">Remember Me</CheckboxField>
          </div>


          {error && (
            <div className="bg-red-soft text-red-dark rounded-lg px-4 py-3 text-sm font-medium animate-slide-up flex items-center gap-2">
              <AlertTriangle aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </Form>
      </Formik>

      <div className="relative flex items-center justify-center my-5">
        <div className="w-full h-px bg-line" />
        <span className="absolute bg-card px-3 text-xs text-ink-3">or continue with</span>
      </div>

      <GoogleAuthLink label="Sign in with Google" />

      <p className="mt-6 text-center text-sm text-ink-3">
        Not a member?{' '}
        <Link href="/signup" className="text-ink font-semibold hover:underline">
          Create an account
        </Link>
      </p>

      <p className="mt-2 text-center text-xs text-ink-3">
        Staff member? Sign in to the{' '}
        <Link href="/agent/login" className="font-medium text-ink hover:underline">
          Agent
        </Link>{' '}
        portal.
      </p>

      <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-ink-3">
        <span>Privacy Policy</span>
        <span aria-hidden="true">·</span>
        <span>Terms of Service</span>
        <span aria-hidden="true">·</span>
        <span>NDPA Compliance</span>
      </div>
    </AuthLayout >
  );
}
