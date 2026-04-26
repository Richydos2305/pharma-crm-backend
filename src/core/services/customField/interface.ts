export interface CreateCustomFieldBody {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'file' | 'dropdown';
  required?: boolean;
  description?: string;
  options?: string[];
}

export interface UpdateCustomFieldBody {
  label?: string;
  type?: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'file' | 'dropdown';
  required?: boolean;
  description?: string;
  options?: string[];
}
