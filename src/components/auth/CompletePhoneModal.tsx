'use client';

import { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import { Phone } from 'lucide-react';
import { toast } from 'react-toastify';
import { settingsApi, ApiError } from '@/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/form';
import { completePhoneSchema } from '@/lib/validation/schemas';
import { hasNeedsPhoneFlag, clearNeedsPhoneFlag } from '@/lib/needsPhone';

/**
 * Google sign-in never collects a phone number. This prompts CLIENT accounts
 * created/linked that way to add one before they hit phone-dependent actions
 * (e.g. submitting a travel request). Dismissible — it reappears next session
 * until the profile actually has a phone on file.
 */
export function CompletePhoneModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(hasNeedsPhoneFlag());
  }, []);

  function dismiss() {
    clearNeedsPhoneFlag();
    setOpen(false);
  }

  async function onSubmit(values: { phone: string }) {
    try {
      await settingsApi.updateProfile({ phone: values.phone.trim() });
      toast.success('Phone number saved.');
      dismiss();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save your phone number. Please try again.');
    }
  }

  return (
    <Modal open={open} title="Add your phone number" onClose={dismiss}>
      <p className="text-sm text-ink-2 mb-4">
        Your Google account didn&apos;t include a phone number, but we need one for things like flight
        updates and ticket delivery.
      </p>
      <Formik initialValues={{ phone: '' }} validationSchema={completePhoneSchema} onSubmit={onSubmit}>
        {({ isSubmitting }) => (
          <Form noValidate className="space-y-4">
            <TextField
              name="phone"
              type="tel"
              label="Phone number"
              placeholder="+234 800 000 0000"
              icon={Phone}
              autoComplete="tel"
            />
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" color="ink" onClick={dismiss} disabled={isSubmitting}>
                Skip for now
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Save
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
