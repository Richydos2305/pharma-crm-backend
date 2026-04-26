import Joi from 'joi';
import { ValidationError } from '../errors/CustomErrors';
import { logger } from './logger';
import { RegisterBody, LoginBody, UpdateProfileBody } from '../services/auth/interface';
import { CreatePatientBody, UpdatePatientBody } from '../services/patient/interface';
import { CreateCustomFieldBody, UpdateCustomFieldBody } from '../services/customField/interface';
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

export const createPatientSchema = Joi.object({
  fullName: Joi.string().required(),
  age: Joi.number().integer().min(0).max(150).required(),
  address: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  pharmacistName: Joi.string().required(),
  prescriptions: Joi.array().items(Joi.string()),
  appointmentDates: Joi.array().items(Joi.string().isoDate()),
  notes: Joi.string(),
  customFields: Joi.object().unknown(true)
});

export const updatePatientSchema = Joi.object({
  fullName: Joi.string(),
  age: Joi.number().integer().min(0).max(150),
  address: Joi.string(),
  phoneNumber: Joi.string(),
  prescriptions: Joi.array().items(Joi.string()),
  appointmentDates: Joi.array().items(Joi.string().isoDate()),
  notes: Joi.string(),
  customFields: Joi.object().unknown(true)
}).min(1);

export const validateCreatePatientPayload = (body: CreatePatientBody): void => {
  validate(body, createPatientSchema, 'Create Patient');
};

export const validateUpdatePatientPayload = (body: UpdatePatientBody): void => {
  validate(body, updatePatientSchema, 'Update Patient');
};

const customFieldTypeValues = ['text', 'textarea', 'number', 'date', 'boolean', 'file', 'dropdown'] as const;

export const createCustomFieldSchema = Joi.object({
  name: Joi.string().required(),
  label: Joi.string().required(),
  type: Joi.string()
    .valid(...customFieldTypeValues)
    .required(),
  required: Joi.boolean(),
  description: Joi.string(),
  options: Joi.array().items(Joi.string())
});

export const updateCustomFieldSchema = Joi.object({
  label: Joi.string(),
  type: Joi.string().valid(...customFieldTypeValues),
  required: Joi.boolean(),
  description: Joi.string(),
  options: Joi.array().items(Joi.string())
}).min(1);

export const validateCreateCustomFieldPayload = (body: CreateCustomFieldBody): void => {
  validate(body, createCustomFieldSchema, 'Create Custom Field');
};

export const validateUpdateCustomFieldPayload = (body: UpdateCustomFieldBody): void => {
  validate(body, updateCustomFieldSchema, 'Update Custom Field');
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
