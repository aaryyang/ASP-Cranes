import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { VisualTemplateEditor } from '../components/quotations/VisualTemplateEditor';
import { Template } from '../types/template';
import { getTemplate, updateTemplate, createTemplate } from '../services/firestore/templateService';
import { useToast } from '../hooks/useToast';
import { ArrowLeft, Save } from 'lucide-react';

export function QuotationTemplateEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [template, setTemplate] = useState<Template>({
    id: '',
    name: '',
    description: '',
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: '',
    isDefault: false
  });

  useEffect(() => {
    if (id) {
      loadTemplate(id);
    }
  }, [id]);

  const loadTemplate = async (templateId: string) => {
    try {
      const loadedTemplate = await getTemplate(templateId);
      if (loadedTemplate) {
        setTemplate(loadedTemplate);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      showToast({
        title: 'Error',
        message: 'Failed to load template',
        type: 'error'
      });
      navigate('/templates');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (template.id) {
        await updateTemplate(template.id, {
          ...template,
          updatedAt: new Date().toISOString()
        });
        showToast({
          title: 'Success',
          message: 'Template updated successfully',
          type: 'success'
        });
      } else {
        const newTemplate = {
          ...template,
          id: `template-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await createTemplate(newTemplate);
        showToast({
          title: 'Success',
          message: 'Template created successfully',
          type: 'success'
        });
      }
      navigate('/templates');
    } catch (error) {
      console.error('Error saving template:', error);
      showToast({
        title: 'Error',
        message: 'Failed to save template',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/templates')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
          <h1 className="text-2xl font-bold">
            {id ? 'Edit Template' : 'Create Template'}
          </h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={isLoading}
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Template'}
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Template Name"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  placeholder="Enter template name"
                />
                <Input
                  label="Description"
                  value={template.description || ''}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  placeholder="Enter template description"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12">
          <Card>
            <CardHeader>
              <CardTitle>Template Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <VisualTemplateEditor
                template={template}
                onChange={(updatedTemplate) => setTemplate(updatedTemplate)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 