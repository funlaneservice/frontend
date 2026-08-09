'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, FieldArray } from 'formik';
import * as yup from 'yup';
import { requestsApi, usersApi, ApiError } from '@/api';
import { useAuthStore } from '@/store/useAuthStore';
import { OTHER_AIRLINE } from '@/lib/constants';
import { AIRLINE_PREFERENCE_OPTIONS } from '@/lib/airlineOptions';
import { CABIN_CLASS_OPTIONS, CABIN_CLASS_BY_LABEL } from '@/lib/cabinClassOptions';
import { newRequestSchema } from '@/lib/validation/schemas';
import { useCityOptions, useNationalityOptions } from '@/hooks/useCountryData';
import { minorAdvisory } from '@/utils/age';
import type { AdminUserView } from '@/interface';
import { toast } from 'react-toastify';
import { PageHeader } from '@/components/ui';
import { TextField, SelectField, DateField, FileField, SegmentedField, ComboboxField, type ComboOption } from '@/components/form';
import {
  Plus,
  X,
  PlaneTakeoff,
  PlaneLanding,
  Plane,
  Clock,
  Armchair,
  User,
  BookUser,
  Globe,
  AlertTriangle,
} from 'lucide-react';

/** Nobody can be born in the future — caps the date-of-birth picker. */
const TODAY_ISO = new Date().toISOString().slice(0, 10);

interface PassengerValues {
  fullName: string;
  passportNumber: string;
  nationality: string;
  passportExpiry: string;
  dateOfBirth: string;
  file: File | null;
}

interface RequestFormValues {
  /** Only used when an admin books on a client's behalf. */
  clientId: string;
  tripType: 'oneway' | 'round';
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  preferredAirline: string;
  /** Free-text airline, used when preferredAirline is the "Other" sentinel. */
  preferredAirlineOther: string;
  preferredTime: string;
  /** Combobox display label (e.g. "Economy") — resolved to the API's cabin-class enum on submit. */
  budgetTier: string;
  passengers: PassengerValues[];
}

const TIME_OPTIONS: ComboOption[] = [
  { value: 'Any time', label: 'Any time', description: 'No preference' },
  { value: 'Morning', label: 'Morning', description: '6AM – 12PM' },
  { value: 'Afternoon', label: 'Afternoon', description: '12PM – 6PM' },
  { value: 'Evening', label: 'Evening', description: 'After 6PM' },
];

const emptyPassenger = (): PassengerValues => ({
  fullName: '',
  passportNumber: '',
  nationality: '',
  passportExpiry: '',
  dateOfBirth: '',
  file: null,
});

const initialValues: RequestFormValues = {
  clientId: '',
  tripType: 'oneway',
  origin: '',
  destination: '',
  departureDate: '',
  returnDate: '',
  preferredAirline: 'No preference',
  preferredAirlineOther: '',
  preferredTime: 'Any time',
  budgetTier: CABIN_CLASS_OPTIONS[0]?.value ?? 'Economy',
  passengers: [emptyPassenger()],
};

interface NewRequestContainerProps {
  /** Where to go after a successful submission. Defaults to the client list. */
  redirectTo?: string;
}

export function NewRequestContainer({ redirectTo = '/client/requests' }: NewRequestContainerProps) {
  const router = useRouter();
  const { options: cityOptions } = useCityOptions();
  const { options: nationalityOptions } = useNationalityOptions();

  // Admins book on a client's behalf — the backend requires a clientId.
  const isAdmin = useAuthStore((s) => s.user?.role) === 'admin';
  const [clients, setClients] = useState<AdminUserView[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    usersApi
      .listUsers({ role: 'CLIENT', limit: 100 })
      .then((res) => setClients(res.users))
      .catch(() => setClients([]));
  }, [isAdmin]);

  const schema = useMemo(
    () =>
      isAdmin
        ? newRequestSchema.concat(yup.object({ clientId: yup.string().required('Select the client this booking is for.') }))
        : newRequestSchema,
    [isAdmin],
  );

  /** Admins get an extra "Client" section, so later steps shift by one. */
  const step = (n: number) => (isAdmin ? n + 1 : n);

  async function handleSubmit(values: RequestFormValues) {
    // "Other" resolves to the free-text airline the client typed.
    const airline =
      values.preferredAirline === OTHER_AIRLINE
        ? values.preferredAirlineOther.trim() || undefined
        : values.preferredAirline === 'No preference'
          ? undefined
          : values.preferredAirline;

    // The combobox shows the friendly label ("Economy"); resolve back to the API enum.
    const budgetTier = CABIN_CLASS_BY_LABEL[values.budgetTier] ?? 'ECONOMY';

    try {
      const { request } = await requestsApi.createRequest({
        clientId: isAdmin ? values.clientId : undefined,
        origin: values.origin.trim(),
        destination: values.destination.trim(),
        departureDate: values.departureDate,
        returnDate: values.tripType === 'round' ? values.returnDate : undefined,
        budgetTier,
        preferredAirline: airline,
        preferredTime: values.preferredTime === 'Any time' ? undefined : values.preferredTime,
        passengers: values.passengers.map(({ file, ...p }) => p),
        passportDocs: values.passengers.map((p) => p.file as File),
      });
      toast.success(`Request submitted for ${request.origin} → ${request.destination}.`);
      router.push(redirectTo);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not submit your request. Please try again.');
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        variant="plain"
        eyebrow="New request"
        eyebrowIcon={PlaneTakeoff}
        title="Create a travel request"
        subtitle="Provide your trip details and we'll prepare a tailored quotation."
      />

      <Formik initialValues={initialValues} validationSchema={schema} onSubmit={handleSubmit}>
        {({ values, isSubmitting }) => (
          <Form noValidate className="space-y-5">
            {isAdmin && (
              <Section step={1} title="Client">
                <SelectField name="clientId" label="Booking for client" icon={User}>
                  <option value="">Select a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.email}
                    </option>
                  ))}
                </SelectField>
                <p className="text-xs text-ink-3">
                  The request will belong to this client — approval locks funds in <em>their</em> wallet.
                </p>
              </Section>
            )}

            <Section step={step(1)} title="Route &amp; trip type">
              <SegmentedField
                name="tripType"
                label="Trip type"
                options={[
                  { value: 'oneway', label: 'One way', icon: PlaneTakeoff },
                  { value: 'round', label: 'Round trip', icon: Plane },
                ]}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <ComboboxField name="origin" label="Origin city" placeholder="Search city or airport" icon={PlaneTakeoff} options={cityOptions} strict />
                <ComboboxField name="destination" label="Destination" placeholder="Search city or airport" icon={PlaneLanding} options={cityOptions} strict />
              </div>
            </Section>

            <Section step={step(2)} title="Schedule &amp; budget">
              <div className="grid sm:grid-cols-2 gap-4">
                <DateField name="departureDate" label="Departure date" />
                {values.tripType === 'round' && (
                  <div className="animate-fade-in">
                    <DateField name="returnDate" label="Return date" min={values.departureDate || undefined} />
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <ComboboxField
                  name="preferredAirline"
                  label="Preferred airline"
                  placeholder="Search airline"
                  icon={Plane}
                  options={AIRLINE_PREFERENCE_OPTIONS}
                  strict
                />
                <ComboboxField
                  name="preferredTime"
                  label="Preferred time"
                  placeholder="Search time"
                  icon={Clock}
                  options={TIME_OPTIONS}
                  strict
                />
                <ComboboxField
                  name="budgetTier"
                  label="Cabin class"
                  placeholder="Search cabin class"
                  icon={Armchair}
                  options={CABIN_CLASS_OPTIONS}
                  strict
                />
              </div>

              {values.preferredAirline === OTHER_AIRLINE && (
                <div className="animate-fade-in">
                  <TextField
                    name="preferredAirlineOther"
                    label="Airline name"
                    placeholder="e.g. Rwandair"
                    icon={Plane}
                  />
                </div>
              )}
            </Section>

            <FieldArray name="passengers">
              {({ push, remove }) => (
                <Section
                  step={step(3)}
                  title="Passengers"
                  action={
                    <button
                      type="button"
                      onClick={() => push(emptyPassenger())}
                      className="inline-flex items-center gap-1.5 text-brand font-semibold text-sm bg-brand-soft px-3.5 py-2 rounded-lg hover:bg-brand hover:text-white transition-colors"
                    >
                      <Plus aria-hidden="true" className="w-4 h-4" /> Add passenger
                    </button>
                  }
                >
                  <div className="space-y-3">
                    {values.passengers.map((p, i) => {
                      const advisory = minorAdvisory(p.dateOfBirth);
                      return (
                        <div key={i} className="p-4 bg-surface border border-line rounded-xl relative animate-fade-in">
                          {values.passengers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(i)}
                              aria-label={`Remove passenger ${i + 1}`}
                              className="absolute top-3 right-3 w-7 h-7 bg-card text-red border border-line rounded-lg flex items-center justify-center hover:bg-red-soft hover:border-red/30 transition-colors"
                            >
                              <X aria-hidden="true" className="w-4 h-4" />
                            </button>
                          )}
                          <div className="grid sm:grid-cols-2 gap-4 pr-8">
                            <TextField name={`passengers.${i}.fullName`} label="Full name" placeholder="Jane Doe" icon={User} />
                            <TextField name={`passengers.${i}.passportNumber`} label="Passport number" placeholder="A00000000" icon={BookUser} />
                            <ComboboxField
                              name={`passengers.${i}.nationality`}
                              label="Nationality"
                              placeholder="Search nationality"
                              icon={Globe}
                              options={nationalityOptions}
                              strict
                            />
                            <DateField name={`passengers.${i}.dateOfBirth`} label="Date of birth" max={TODAY_ISO} />
                            <DateField name={`passengers.${i}.passportExpiry`} label="Passport expiry" />
                            <FileField
                              name={`passengers.${i}.file`}
                              label="Passport scan"
                              accept="image/jpeg,image/png,application/pdf"
                              placeholder="Upload JPEG/PNG/PDF"
                            />
                          </div>
                          {advisory && (
                            <div className="mt-3 pr-8 flex items-start gap-2 text-xs text-amber-dark bg-amber-soft px-3 py-2.5 rounded-lg animate-fade-in">
                              <AlertTriangle aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>{advisory}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
            </FieldArray>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand text-white py-3.5 rounded-xl font-semibold text-base hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting…' : 'Submit request'}
              </button>
              <p className="text-center text-xs text-ink-3">Our team will review your request and provide quotation options shortly.</p>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

function Section({ step, title, action, children }: { step: number; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl border border-line shadow-card p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-brand-soft text-brand flex items-center justify-center text-sm font-semibold">{step}</span>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
