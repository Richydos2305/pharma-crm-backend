import Joi from 'joi';
import { ValidationError } from '../errors/CustomErrors';
import { logger } from './logger';
import {
  RegisterBody,
  LoginBody,
  UpdateProfileBody,
  VerifyEmailBody,
  ResendVerificationBody,
  ForgotPasswordBody,
  ResetPasswordBody
} from '../services/auth/interface';
import { CreatePatientBody, UpdatePatientBody } from '../services/patient/interface';
import { QueueJobPayload, QueueOperationType } from '../services/queue/interface';
import { SettingsData } from '../services/setting/interface';
import { CreatePharmacistBody, UpdatePharmacistBody } from '../services/pharmacist/interface';

const validate = (body: object, schema: Joi.ObjectSchema | Joi.Schema, context: string): void => {
  const { error } = schema.validate(body, { abortEarly: false });
  if (error) {
    logger.warn(`Validation failed: ${context}`, { error: error.details[0].message });
    throw new ValidationError(error.details.map((d) => d.message).join(', '));
  }
};

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const refreshSchema = Joi.object({
  token: Joi.string().required()
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required()
});

export const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required()
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

export const idParamSchema = Joi.object({
  id: Joi.string().required()
});

export const publicIdParamSchema = Joi.object({
  publicId: Joi.string().required()
});

export const updateProfileSchema = Joi.object({
  fullName: Joi.string(),
  phoneNumber: Joi.string(),
  companyName: Joi.string(),
  companyLogo: Joi.string(),
  primaryColor: Joi.string()
}).min(1);

export const validateRegisterPayload = (body: RegisterBody): void => {
  validate(body, registerSchema, 'User Registration');
};

export const validateLoginPayload = (body: LoginBody): void => {
  validate(body, loginSchema, 'User Login');
};

export const validateUpdateProfilePayload = (body: UpdateProfileBody): void => {
  validate(body, updateProfileSchema, 'Update Profile');
};

export const validateVerifyEmailPayload = (body: VerifyEmailBody): void => {
  validate(body, verifyEmailSchema, 'Verify Email');
};

export const validateResendVerificationPayload = (body: ResendVerificationBody): void => {
  validate(body, resendVerificationSchema, 'Resend Verification');
};

export const validateForgotPasswordPayload = (body: ForgotPasswordBody): void => {
  validate(body, forgotPasswordSchema, 'Forgot Password');
};

export const validateResetPasswordPayload = (body: ResetPasswordBody): void => {
  validate(body, resetPasswordSchema, 'Reset Password');
};

const customFieldsSchema = Joi.object({
  sections: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        fields: Joi.array().items(Joi.object().unknown(true)).required()
      })
    )
    .required()
});

export const createPatientSchema = Joi.object({
  _id: Joi.string().hex().length(24).optional(),
  fullName: Joi.string().required(),
  age: Joi.number().min(0).max(150).required(),
  phoneNumber: Joi.string().required(),
  customFields: customFieldsSchema.required()
});

export const updatePatientSchema = Joi.object({
  fullName: Joi.string(),
  age: Joi.number().min(0).max(150),
  phoneNumber: Joi.string(),
  customFields: customFieldsSchema
}).min(1);

export const enqueueJobSchema = Joi.object({
  operation: Joi.string()
    .valid(...Object.values(QueueOperationType))
    .required(),
  localId: Joi.string().required(),
  data: Joi.object().required()
});

export const validateCreatePatientPayload = (body: CreatePatientBody): void => {
  validate(body, createPatientSchema, 'Create Patient');
};

export const validateUpdatePatientPayload = (body: UpdatePatientBody): void => {
  validate(body, updatePatientSchema, 'Update Patient');
};

const customFieldTypeValues = ['text', 'textarea', 'number', 'date', 'boolean', 'file', 'dropdown'] as const;

export const formCustomFieldSchema = Joi.object({
  name: Joi.string().required(),
  label: Joi.string().required(),
  type: Joi.string()
    .valid(...customFieldTypeValues)
    .required(),
  required: Joi.boolean(),
  section: Joi.string(),
  description: Joi.string(),
  options: Joi.array().items(Joi.string())
});

export const updateSettingsSchema = Joi.object({
  formConfig: Joi.object({
    schema: Joi.object().unknown(true)
  })
}).min(1);

export const validateUpdateSettingsPayload = (body: SettingsData): void => {
  validate(body, updateSettingsSchema, 'Update Settings');
};

export const createPharmacistSchema = Joi.object({
  name: Joi.string().required(),
  phoneNumber: Joi.string()
});

export const updatePharmacistSchema = Joi.object({
  name: Joi.string(),
  phoneNumber: Joi.string()
}).min(1);

export const validateCreatePharmacistPayload = (body: CreatePharmacistBody): void => {
  validate(body, createPharmacistSchema, 'Create Pharmacist');
};

export const validateUpdatePharmacistPayload = (body: UpdatePharmacistBody): void => {
  validate(body, updatePharmacistSchema, 'Update Pharmacist');
};

export const validateFileUpload = (file: Express.Multer.File | undefined): void => {
  if (!file) throw new ValidationError('No file provided');
};

export const validateEnqueueJobPayload = (body: QueueJobPayload): void => {
  validate(body, enqueueJobSchema, 'Queue Job');
};
