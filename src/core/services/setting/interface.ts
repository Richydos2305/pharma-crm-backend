export type CustomFieldType = 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'file' | 'dropdown';

export interface FormCustomField {
  name: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  section?: string;
  description?: string;
  options?: string[];
}

export interface FormConfigData {
  customFields: FormCustomField[];
}

export interface SettingsData {
  formConfig?: FormConfigData;
}
