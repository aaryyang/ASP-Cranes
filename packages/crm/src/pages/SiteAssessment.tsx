import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Check,
  FileImage, 
  Link2, 
  Phone, 
  Plus, 
  Send, 
  Tag, 
  Trash2, 
  Upload,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { TextArea } from '../components/common/TextArea';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

interface SiteConstraint {
  id: string;
  label: string;
  description?: string;
}

const SITE_CONSTRAINTS: SiteConstraint[] = [
  { 
    id: 'road_access', 
    label: 'Road Access',
    description: 'Accessibility for crane transport'
  },
  { 
    id: 'height_limits', 
    label: 'Height Limits',
    description: 'Overhead restrictions'
  },
  { 
    id: 'crane_setup', 
    label: 'Crane Setup Area',
    description: 'Space available for crane positioning'
  },
  { 
    id: 'power_lines', 
    label: 'Power Lines',
    description: 'Proximity to electrical infrastructure'
  },
  { 
    id: 'surface_type', 
    label: 'Surface Type',
    description: 'Ground conditions and stability'
  },
  { 
    id: 'other', 
    label: 'Other',
    description: 'Additional site-specific constraints'
  },
];

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  annotations?: string[];
}

interface SelectedConstraint extends SiteConstraint {
  notes?: string;
}

export function SiteAssessment() {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedConstraints, setSelectedConstraints] = useState<SelectedConstraint[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UploadedFile | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types and size
    const validFiles = selectedFiles.filter(file => {
      const isValidType = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'video/mp4',
        'video/quicktime'
      ].includes(file.type);
      
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType || !isValidSize) {
        showToast(
          'Invalid file',
          `${file.name} is not supported. Please upload images (JPEG, PNG) or videos (MP4) under 10MB.`,
          'error'
        );
        return false;
      }
      
      return true;
    });
    
    // Create preview URLs
    const newFiles = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      preview: URL.createObjectURL(file),
      annotations: [],
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const fileInput = fileInputRef.current;
    
    if (fileInput) {
      const dataTransfer = new DataTransfer();
      droppedFiles.forEach(file => dataTransfer.items.add(file));
      fileInput.files = dataTransfer.files;
      
      // Trigger change event
      const event = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(event);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const removeFile = (id: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== id);
      // Clean up preview URLs
      prev.forEach(f => {
        if (f.id === id) {
          URL.revokeObjectURL(f.preview);
        }
      });
      return updatedFiles;
    });
  };
  
  const toggleConstraint = (constraint: SiteConstraint) => {
    setSelectedConstraints(prev => {
      const exists = prev.find(c => c.id === constraint.id);
      if (exists) {
        return prev.filter(c => c.id !== constraint.id);
      }
      return [...prev, { ...constraint }];
    });
  };
  
  const updateConstraintNotes = (constraintId: string, notes: string) => {
    setSelectedConstraints(prev =>
      prev.map(c =>
        c.id === constraintId
          ? { ...c, notes }
          : c
      )
    );
  };
  
  const handleRemoteAssessment = async () => {
    if (!phoneNumber.match(/^\+?[\d\s-]{10,}$/)) {
      showToast('Invalid phone number', 'Please enter a valid phone number', 'error');
      return;
    }
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToast(
        'Assessment link sent',
        `A remote assessment link has been sent to ${phoneNumber}`,
        'success'
      );
      
      setPhoneNumber('');
    } catch (error) {
      showToast('Error sending link', 'Please try again later', 'error');
    }
  };
  
  const showToast = (
    title: string,
    description?: string,
    variant: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, title, description, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 5000);
  };
  
  // Clean up preview URLs when component unmounts
  React.useEffect(() => {
    return () => {
      files.forEach(file => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, []);
  
  if (!user || (user.role !== 'sales_agent' && user.role !== 'operator' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Media Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                onChange={handleFileSelect}
              />
              
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Upload className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Files
                  </Button>
                  <p className="mt-2 text-sm text-gray-500">
                    or drag and drop files here
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  Supported formats: JPEG, PNG, MP4 (max 10MB)
                </p>
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="relative group rounded-lg overflow-hidden border border-gray-200"
                  >
                    {file.file.type.startsWith('image/') ? (
                      <img
                        src={file.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <video
                        src={file.preview}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {file.file.type.startsWith('image/') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:text-white hover:bg-black/20"
                          onClick={() => {
                            setSelectedImage(file);
                            setIsAnnotating(true);
                          }}
                        >
                          <FileImage size={16} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:text-white hover:bg-black/20"
                        onClick={() => removeFile(file.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                      {file.file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Constraints Section */}
        <Card>
          <CardHeader>
            <CardTitle>Site Constraints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {SITE_CONSTRAINTS.map((constraint) => (
                <div
                  key={constraint.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    selectedConstraints.some(c => c.id === constraint.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors ${
                        selectedConstraints.some(c => c.id === constraint.id)
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}
                      onClick={() => toggleConstraint(constraint)}
                    >
                      {selectedConstraints.some(c => c.id === constraint.id) && (
                        <Check className="text-white h-4 w-4" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <label className="font-medium text-gray-900">
                        {constraint.label}
                      </label>
                      {constraint.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {constraint.description}
                        </p>
                      )}
                      
                      {selectedConstraints.some(c => c.id === constraint.id) && (
                        <TextArea
                          className="mt-3"
                          placeholder="Add notes about this constraint..."
                          value={
                            selectedConstraints.find(c => c.id === constraint.id)?.notes || ''
                          }
                          onChange={(e) => updateConstraintNotes(constraint.id, e.target.value)}
                          rows={2}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Remote Assessment Section */}
      <Card>
        <CardHeader>
          <CardTitle>Remote Site Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <div className="flex gap-3">
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Button
                onClick={handleRemoteAssessment}
                leftIcon={<Send size={16} />}
              >
                Send Link
              </Button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Send a link to conduct remote site assessment via video call
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Uploaded Media ({files.length})
              </h3>
              {files.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1 flex items-center gap-2"
                    >
                      {file.file.type.startsWith('image/') ? (
                        <Camera size={14} />
                      ) : (
                        <FileImage size={14} />
                      )}
                      <span className="truncate max-w-[200px]">
                        {file.file.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No media uploaded yet</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Tagged Constraints ({selectedConstraints.length})
              </h3>
              {selectedConstraints.length > 0 ? (
                <div className="space-y-3">
                  {selectedConstraints.map((constraint) => (
                    <div
                      key={constraint.id}
                      className="bg-gray-50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Tag size={14} />
                        {constraint.label}
                      </div>
                      {constraint.notes && (
                        <p className="mt-1 text-sm text-gray-600">
                          {constraint.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No constraints tagged yet</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Image Annotation Modal */}
      <AnimatePresence>
        {isAnnotating && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-modal max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Image Annotation</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsAnnotating(false);
                    setSelectedImage(null);
                  }}
                >
                  <X size={20} />
                </Button>
              </div>
              
              <div className="p-4">
                <div className="relative">
                  <img
                    src={selectedImage.preview}
                    alt="Annotation"
                    className="max-w-full h-auto"
                  />
                  {/* Annotation canvas would go here */}
                </div>
                
                <div className="mt-4 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => {
                    setIsAnnotating(false);
                    setSelectedImage(null);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    // Save annotations logic would go here
                    setIsAnnotating(false);
                    setSelectedImage(null);
                    showToast('Annotations saved', undefined, 'success');
                  }}>
                    Save Annotations
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}