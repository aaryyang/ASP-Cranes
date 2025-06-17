export interface TemplateElement {
  id: string;
  type: 'text' | 'table' | 'image' | 'heading' | 'list' | 'spacer';
  content?: string;
  style?: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    alignment?: 'left' | 'center' | 'right';
    marginTop?: string;
    marginBottom?: string;
    width?: string;
    height?: string;
  };
  tableData?: {
    headers?: string[];
    rows?: any[][];
    widths?: string[];
  };
  imageUrl?: string;
  dynamicField?: string;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  description: string;
  elements: TemplateElement[];
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  layout: {
    pageSize: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
}

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'array';
  defaultValue?: any;
} 