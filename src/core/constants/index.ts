export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL: 500
} as const;

export const TokenConfig = {
  ACCESS_EXPIRY: '1h',
  REFRESH_EXPIRY: '7d'
} as const;

export const SecurityConfig = {
  BCRYPT_ROUNDS: 12
} as const;

export const VerificationTokenTypes = {
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset'
} as const;

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
  'audio/mp4',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const CloudinaryFolder = {
  PATIENT_RECORDS: 'patient-records',
  COMPANY_LOGOS: 'company-logos'
} as const;

export const QueueNames = { MAIN: 'pharmaprs' } as const;

export const PatientFormFieldIds = {
  ATTENDED_BY: 'core-attended-to-by'
} as const;

export const DEFAULT_FORM_SCHEMA = {
  id: 'default-patient-form',
  name: 'Patient Form',
  status: 'published',
  sections: [
    {
      id: 'personal-info',
      name: 'Personal Information',
      type: 'standard',
      locked: true,
      fields: [
        { id: 'core-full-name', label: 'Full Name', type: 'short_text', required: true, locked: true },
        { id: 'core-age', label: 'Age', type: 'number', required: true, locked: true },
        { id: 'core-phone-number', label: 'Phone Number', type: 'short_text', required: true, locked: true },
        { id: 'core-address', label: 'Home Address', type: 'short_text', required: false }
      ]
    },
    {
      id: 'medical-info',
      name: 'Medical Information',
      type: 'standard',
      fields: [
        { id: 'core-appointment-date', label: 'Appointment Date', type: 'date', required: false },
        { id: 'core-attended-to-by', label: 'Attended To By', type: 'relation', required: true, locked: true },
        { id: 'core-notes', label: 'Notes', type: 'textarea', required: false }
      ]
    },
    {
      id: 'core-prescriptions',
      name: 'Prescriptions',
      type: 'repeatable',
      rowLabel: 'Prescription',
      addButtonLabel: 'Add another prescription',
      fields: [{ id: 'core-prescription-text', label: 'Prescription', type: 'textarea', required: false }]
    }
  ]
};
