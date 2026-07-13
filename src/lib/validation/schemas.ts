import * as yup from 'yup';

/* Shared field rules -------------------------------------------------- */

const email = yup
  .string()
  .trim()
  .required('Email address is required.')
  .email('Enter a valid email address.');

const requiredPassword = yup.string().required('Password is required.');

const strongPassword = yup
  .string()
  .required('Password is required.')
  .min(8, 'Password must be at least 8 characters.');

const phone = yup
  .string()
  .trim()
  .required('Phone number is required.')
  .min(7, 'Enter a valid phone number.');

const name = (label: string) => yup.string().trim().required(`${label} is required.`);

/* Auth ---------------------------------------------------------------- */

export const loginSchema = yup.object({
  email,
  password: requiredPassword,
});

export const staffLoginSchema = loginSchema;

export const signupSchema = yup.object({
  firstName: name('First name'),
  lastName: name('Last name'),
  email,
  phone,
  password: strongPassword,
  confirm: yup
    .string()
    .required('Please confirm your password.')
    .oneOf([yup.ref('password')], 'Passwords do not match.'),
  ndpaConsent: yup
    .boolean()
    .oneOf([true], 'You must accept the Privacy Policy to continue.'),
});

export const forgotPasswordSchema = yup.object({ email });

export const resetPasswordSchema = yup.object({
  password: strongPassword,
  confirm: yup
    .string()
    .required('Please confirm your password.')
    .oneOf([yup.ref('password')], 'Passwords do not match.'),
});

export const adminRegisterSchema = yup.object({
  firstName: name('First name'),
  lastName: name('Last name'),
  email,
  phone,
  password: strongPassword,
  confirm: yup
    .string()
    .required('Please confirm your password.')
    .oneOf([yup.ref('password')], 'Passwords do not match.'),
});

/* Settings (self-service) --------------------------------------------- */

export const updateProfileSchema = yup.object({
  name: name('Full name'),
  phone,
});

/** Prompted after a Google sign-in whose account has no phone on file. */
export const completePhoneSchema = yup.object({ phone });

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Enter your current password.'),
  newPassword: strongPassword,
  confirm: yup
    .string()
    .required('Please confirm your new password.')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match.'),
});

/* Admin onboarding ---------------------------------------------------- */

export const onboardAgentSchema = yup.object({
  name: name('Full name'),
  email,
  phone,
});

export const createAdminSchema = yup.object({
  name: name('Full name'),
  email,
  phone,
  password: strongPassword,
});

/* Travel requests ----------------------------------------------------- */

/** Passport numbers worldwide are 6–9 characters, letters and digits only. */
const passportNumber = yup
  .string()
  .trim()
  .required('Passport number is required.')
  .matches(/^[A-Za-z0-9]{6,9}$/, 'Enter a valid passport number (6–9 letters or numbers, no spaces or symbols).');

export const passengerSchema = yup.object({
  fullName: yup.string().trim().required('Full name is required.'),
  passportNumber,
  nationality: yup.string().trim().required('Nationality is required.'),
  dateOfBirth: yup.string().required('Date of birth is required.'),
  passportExpiry: yup.string().required('Passport expiry is required.'),
  file: yup
    .mixed<File>()
    .nullable()
    .required('A passport scan (JPEG, PNG or PDF) is required.'),
});

export const newRequestSchema = yup.object({
  tripType: yup.string().oneOf(['oneway', 'round']).required(),
  origin: yup.string().trim().required('Origin city is required.'),
  destination: yup.string().trim().required('Destination is required.'),
  departureDate: yup.string().required('Departure date is required.'),
  returnDate: yup.string().when('tripType', {
    is: 'round',
    then: (s) => s.required('Return date is required for a round trip.'),
    otherwise: (s) => s.notRequired(),
  }),
  budgetTier: yup.string().required('Select a cabin class.'),
  passengers: yup.array().of(passengerSchema).min(1, 'Add at least one passenger.').required(),
});

export const quoteOptionSchema = yup.object({
  label: yup.string().trim().required('A label is required.'),
  airline: yup.string().trim().required('Airline is required.'),
  price: yup
    .number()
    .typeError('Enter a price.')
    .required('Enter a price.')
    .positive('Price must be greater than zero.'),
  departureTime: yup.string().trim().required('Departure time is required.'),
});

/* Wallet -------------------------------------------------------------- */

export const topupSchema = yup.object({
  amount: yup
    .number()
    .typeError('Enter an amount.')
    .required('Enter an amount.')
    .positive('Amount must be greater than zero.')
    .min(100, 'Minimum top-up is ₦100.'),
});
