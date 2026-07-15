'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, useFormikContext, type FormikHelpers } from 'formik';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/api';
import { IconArrowRight } from '@/components/ui/icons';
import { User, Mail, Phone, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { GoogleAuthLink } from '@/components/auth/GoogleAuthLink';
import { TextField, CheckboxField } from '@/components/form';
import { signupSchema } from '@/lib/validation/schemas';

type SignUpValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  ndpaConsent: boolean;
};

const initialValues: SignUpValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
  ndpaConsent: false,
};

/** Same rules as usePasswordStrength, as a pure function so it can run anywhere. */
function passwordChecks(password: string) {
  const met = {
    length: password.length >= 8,
    mixed: /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = (met.length ? 1 : 0) + (met.mixed ? 2 : 0) + (met.special ? 1 : 0);
  return { met, score };
}

export function SignUpContainer() {
  const router = useRouter();
  const { register } = useAuth();

  async function onSubmit(values: SignUpValues, helpers: FormikHelpers<SignUpValues>) {
    if (passwordChecks(values.password).score < 2) {
      helpers.setFieldError('password', 'Password does not meet complexity requirements (8+ mixed characters).');
      return;
    }

    // Compliance log captured client-side; not part of the backend contract.
    console.log('Compliance Log Captured:', {
      timestamp: new Date().toISOString(),
      ndpaAccepted: true,
    });

    try {
      const name = `${values.firstName} ${values.lastName}`.trim();
      const email = values.email.trim();
      await register({
        name,
        email,
        phone: values.phone.trim(),
        password: values.password,
      });
      // Send the new client to the "check your inbox" screen — they must
      // verify their email before they can log in.
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not create your account. Please try again.')
    }
  }

  return (
    <AuthLayout title="Global Logistics, Simplified."
      description="Join an exclusive network of travelers and corporations moving the world with confidence.">
      <h1 className="text-2xl font-bold text-ink mb-1.5">Create an account</h1>
      <p className="text-ink-3 text-sm mb-6">Join Funlane Travels &amp; Logistics.</p>

      <Formik initialValues={initialValues} validationSchema={signupSchema} onSubmit={onSubmit}>
        <SignUpFormFields />
      </Formik>

      <div className="relative flex items-center justify-center my-5">
        <div className="w-full h-px bg-line" />
        <span className="absolute bg-card px-3 text-xs text-ink-3">or continue with</span>
      </div>

      <GoogleAuthLink label="Sign up with Google" />

      <p className="mt-6 text-center text-sm text-ink-3">
        Already have an account?{' '}
        <Link href="/login" className="text-ink font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

/** Rendered inside <Formik> so it can read live values for the strength chips. */
function SignUpFormFields() {
  const { values, isSubmitting } = useFormikContext<SignUpValues>();
  const { met } = passwordChecks(values.password);

  return (
    <Form noValidate className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField name="firstName" label="First name" placeholder="John" icon={User} autoComplete="given-name" />
        <TextField name="lastName" label="Last name" placeholder="Doe" icon={User} autoComplete="family-name" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField name="email" type="email" label="Email address" placeholder="name@company.com" icon={Mail} autoComplete="email" />
        <TextField name="phone" type="tel" label="Phone number" placeholder="+1 (555) 000-0000" icon={Phone} autoComplete="tel" />
      </div>

      <div>
        <TextField
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          icon={Lock}
          autoComplete="new-password"
          id="signup-password"
        />
        {values.password && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            <StrengthChip active={met.length} label="8+ characters" />
            <StrengthChip active={met.mixed && met.special} label="Mixed case / symbols" />
          </div>
        )}
      </div>

      <TextField
        name="confirm"
        type="password"
        label="Confirm password"
        placeholder="••••••••"
        icon={Lock}
        autoComplete="new-password"
        id="confirm-password"
      />

      <CheckboxField name="ndpaConsent" className="bg-surface rounded-lg p-3.5 border border-line">
        <span className="text-xs text-ink-2 leading-relaxed">
          I agree to the <span className="text-ink font-semibold underline">Terms of Service</span> and{' '}
          <span className="text-ink font-semibold underline">Privacy Policy</span>, and consent to
          NDPA-compliant data processing.
        </span>
      </CheckboxField>

      <button type="submit" disabled={isSubmitting} className="auth-btn">
        {isSubmitting ? 'Creating account…' : 'Create account'}
        {!isSubmitting && <IconArrowRight className="w-4 h-4" />}
      </button>
    </Form>
  );
}

function StrengthChip({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`text-[11px] font-medium px-2 py-1 rounded-md border ${active ? 'bg-green-soft text-green-dark border-green/20' : 'bg-surface text-ink-3 border-line'
        }`}
    >
      {label}
    </span>
  );
}
