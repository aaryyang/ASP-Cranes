
import { Button } from '../common/Button';
import { Template } from '../../types/template';
import { Edit2, Eye, Copy, Trash2, FileText } from 'lucide-react';

interface TemplateCardProps {
  template: Template;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onSetDefault: () => void;
}

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onPreview,
  onSetDefault
}: TemplateCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
      {/* Template Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
        <FileText className="h-5 w-5 text-gray-700 mr-3" />
        <h3 className="text-lg font-medium text-gray-900 flex-1">{template.name}</h3>
      </div>
      
      {/* Template Description */}
      <div className="p-4 flex-1">
        {template.description && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-3">
            {template.description}
          </p>
        )}
        {template.isDefault && (
          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-md">
            Default Template
          </span>
        )}
      </div>
      
      {/* Template Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEdit}
          className="flex items-center"
        >
          <Edit2 className="h-4 w-4 mr-1.5" />
          Edit
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onPreview}
          className="flex items-center"
        >
          <Eye className="h-4 w-4 mr-1.5" />
          Preview
        </Button>
        
        {!template.isDefault && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSetDefault}
              className="flex items-center"
            >
              <Copy className="h-4 w-4 mr-1.5" />
              Set Default
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDelete}
              className="flex items-center text-red-500 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );
}