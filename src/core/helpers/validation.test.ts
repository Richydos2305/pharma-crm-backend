import { describe, it, expect, vi } from 'vitest';

vi.mock('./logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));
import {
  validateRegisterPayload,
  validateLoginPayload,
  validateUpdateProfilePayload,
  validateVerifyEmailPayload,
  validateResendVerificationPayload,
  validateForgotPasswordPayload,
  validateResetPasswordPayload,
  validateCreatePatientPayload,
  validateUpdatePatientPayload,
  validateUpdateSettingsPayload,
  validateCreatePharmacistPayload,
  validateUpdatePharmacistPayload,
  validateFileUpload
} from './validation';
import { ValidationError } from '../errors/CustomErrors';

// ─── Factories ────────────────────────────────────────────────────────────────

const validRegister = () => ({ email: 'user@example.com', password: 'password123', fullName: 'Jane Doe' });
const validLogin = () => ({ email: 'user@example.com', password: 'password123' });
const validPatient = () => ({
  fullName: 'John Smith',
  age: 30,
  phoneNumber: '08012345678',
  customFields: {
    sections: [{ name: 'medical-information', fields: [{ 'core-attended-to-by': 'Dr. Ada' }] }]
  }
});
const validPharmacist = () => ({ name: 'Dr. Ada' });
const validFile = () => ({ originalname: 'test.pdf', mimetype: 'application/pdf', size: 1024 }) as Express.Multer.File;

// ─── validateRegisterPayload ──────────────────────────────────────────────────

describe('validateRegisterPayload', () => {
  it('does not throw for a valid payload', () => {
    expect(() => validateRegisterPayload(validRegister())).not.toThrow();
  });

  it('throws ValidationError when email is missing', () => {
    expect(() => validateRegisterPayload({ ...validRegister(), email: '' })).toThrow(ValidationError);
  });

  it('throws ValidationError when email is an invalid format', () => {
    expect(() => validateRegisterPayload({ ...validRegister(), email: 'not-an-email' })).toThrow(ValidationError);
  });

  it('throws ValidationError when password is shorter than 8 characters', () => {
    expect(() => validateRegisterPayload({ ...validRegister(), password: 'short' })).toThrow(ValidationError);
  });

  it('throws ValidationError when fullName is missing', () => {
    expect(() => validateRegisterPayload({ ...validRegister(), fullName: '' })).toThrow(ValidationError);
  });
});

// ─── validateLoginPayload ─────────────────────────────────────────────────────

describe('validateLoginPayload', () => {
  it('does not throw for a valid payload', () => {
    expect(() => validateLoginPayload(validLogin())).not.toThrow();
  });

  it('throws ValidationError when email is missing', () => {
    expect(() => validateLoginPayload({ ...validLogin(), email: '' })).toThrow(ValidationError);
  });

  it('throws ValidationError when password is missing', () => {
    expect(() => validateLoginPayload({ ...validLogin(), password: '' })).toThrow(ValidationError);
  });
});

// ─── validateUpdateProfilePayload ────────────────────────────────────────────

describe('validateUpdateProfilePayload', () => {
  it('does not throw when at least one optional field is provided', () => {
    expect(() => validateUpdateProfilePayload({ fullName: 'New Name' })).not.toThrow();
  });

  it('throws ValidationError when body is empty', () => {
    expect(() => validateUpdateProfilePayload({} as any)).toThrow(ValidationError);
  });
});

// ─── validateVerifyEmailPayload ───────────────────────────────────────────────

describe('validateVerifyEmailPayload', () => {
  it('does not throw for a valid payload', () => {
    expect(() => validateVerifyEmailPayload({ token: 'abc123' })).not.toThrow();
  });

  it('throws ValidationError when token is missing', () => {
    expect(() => validateVerifyEmailPayload({ token: '' })).toThrow(ValidationError);
  });
});

// ─── validateResendVerificationPayload ───────────────────────────────────────

describe('validateResendVerificationPayload', () => {
  it('does not throw for a valid email', () => {
    expect(() => validateResendVerificationPayload({ email: 'user@example.com' })).not.toThrow();
  });

  it('throws ValidationError for an invalid email format', () => {
    expect(() => validateResendVerificationPayload({ email: 'not-an-email' })).toThrow(ValidationError);
  });
});

// ─── validateForgotPasswordPayload ───────────────────────────────────────────

describe('validateForgotPasswordPayload', () => {
  it('does not throw for a valid email', () => {
    expect(() => validateForgotPasswordPayload({ email: 'user@example.com' })).not.toThrow();
  });

  it('throws ValidationError for an invalid email format', () => {
    expect(() => validateForgotPasswordPayload({ email: 'bad-email' })).toThrow(ValidationError);
  });
});

// ─── validateResetPasswordPayload ────────────────────────────────────────────

describe('validateResetPasswordPayload', () => {
  it('does not throw for a valid payload', () => {
    expect(() => validateResetPasswordPayload({ token: 'reset-token', newPassword: 'newpass123' })).not.toThrow();
  });

  it('throws ValidationError when newPassword is shorter than 8 characters', () => {
    expect(() => validateResetPasswordPayload({ token: 'reset-token', newPassword: 'short' })).toThrow(ValidationError);
  });
});

// ─── validateCreatePatientPayload ────────────────────────────────────────────

describe('validateCreatePatientPayload', () => {
  it('does not throw for a valid payload', () => {
    expect(() => validateCreatePatientPayload(validPatient())).not.toThrow();
  });

  it('throws ValidationError when fullName is missing', () => {
    const { fullName: _fullName, ...rest } = validPatient();
    expect(() => validateCreatePatientPayload(rest as any)).toThrow(ValidationError);
  });

  it('throws ValidationError when age is missing', () => {
    const { age: _age, ...rest } = validPatient();
    expect(() => validateCreatePatientPayload(rest as any)).toThrow(ValidationError);
  });

  it('throws ValidationError when phoneNumber is missing', () => {
    const { phoneNumber: _phoneNumber, ...rest } = validPatient();
    expect(() => validateCreatePatientPayload(rest as any)).toThrow(ValidationError);
  });

  it('throws ValidationError when customFields is missing', () => {
    const { customFields: _customFields, ...rest } = validPatient();
    expect(() => validateCreatePatientPayload(rest as any)).toThrow(ValidationError);
  });

  it('throws ValidationError when customFields.sections[].fields is missing', () => {
    const invalid = { ...validPatient(), customFields: { sections: [{ name: 'medical-information' }] } };
    expect(() => validateCreatePatientPayload(invalid as any)).toThrow(ValidationError);
  });

  it('throws ValidationError when age is below 0', () => {
    expect(() => validateCreatePatientPayload({ ...validPatient(), age: -1 })).toThrow(ValidationError);
  });

  it('throws ValidationError when age is above 150', () => {
    expect(() => validateCreatePatientPayload({ ...validPatient(), age: 151 })).toThrow(ValidationError);
  });
});

// ─── validateUpdatePatientPayload ────────────────────────────────────────────

describe('validateUpdatePatientPayload', () => {
  it('does not throw when at least one field is provided', () => {
    expect(() => validateUpdatePatientPayload({ fullName: 'Updated Name' })).not.toThrow();
  });

  it('throws ValidationError when body is empty', () => {
    expect(() => validateUpdatePatientPayload({} as any)).toThrow(ValidationError);
  });
});

// ─── validateUpdateSettingsPayload ───────────────────────────────────────────

describe('validateUpdateSettingsPayload', () => {
  it('does not throw for a valid payload', () => {
    expect(() => validateUpdateSettingsPayload({ formConfig: { schema: { field1: 'text' } } } as any)).not.toThrow();
  });

  it('throws ValidationError when body is empty', () => {
    expect(() => validateUpdateSettingsPayload({} as any)).toThrow(ValidationError);
  });
});

// ─── validateCreatePharmacistPayload ─────────────────────────────────────────

describe('validateCreatePharmacistPayload', () => {
  it('does not throw for a valid payload', () => {
    expect(() => validateCreatePharmacistPayload(validPharmacist())).not.toThrow();
  });

  it('throws ValidationError when name is missing', () => {
    expect(() => validateCreatePharmacistPayload({ name: '' })).toThrow(ValidationError);
  });
});

// ─── validateUpdatePharmacistPayload ─────────────────────────────────────────

describe('validateUpdatePharmacistPayload', () => {
  it('does not throw when at least one field is provided', () => {
    expect(() => validateUpdatePharmacistPayload({ name: 'Updated Name' })).not.toThrow();
  });

  it('throws ValidationError when body is empty', () => {
    expect(() => validateUpdatePharmacistPayload({} as any)).toThrow(ValidationError);
  });
});

// ─── validateFileUpload ───────────────────────────────────────────────────────

describe('validateFileUpload', () => {
  it('does not throw when a file is provided', () => {
    expect(() => validateFileUpload(validFile())).not.toThrow();
  });

  it('throws ValidationError when file is undefined', () => {
    expect(() => validateFileUpload(undefined)).toThrow(ValidationError);
  });
});
