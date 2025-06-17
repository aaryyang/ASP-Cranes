export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string; // Template content with {{placeholders}}
  styles?: string;
  createdAt: string;  // ISO date string
  updatedAt: string;  // ISO date string
  createdBy?: string;
  isDefault: boolean;
}