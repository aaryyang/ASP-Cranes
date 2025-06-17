import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/common/FormInput';
import { Select } from '../components/common/Select';
import { TextArea } from '../components/common/TextArea';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatters';

interface Service {
  id: string;
  name: string;
  type: string;
  baseRate: number;
  unit: 'hour' | 'day' | 'shift';
  description: string;
  isActive: boolean;
}

const SERVICE_TYPES = [
  { value: 'lifting', label: 'Lifting Service' },
  { value: 'transport', label: 'Transport Service' },
  { value: 'attachment', label: 'Attachment Rental' },
  { value: 'operator', label: 'Operator Assistance' },
  { value: 'consultation', label: 'Technical Consultation' },
];

const UNIT_OPTIONS = [
  { value: 'hour', label: 'Per Hour' },
  { value: 'day', label: 'Per Day' },
  { value: 'shift', label: 'Per Shift' },
];

// Mock initial services
const INITIAL_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Standard Lifting Service',
    type: 'lifting',
    baseRate: 250,
    unit: 'hour',
    description: 'Basic crane lifting service with standard safety protocols',
    isActive: true,
  },
  {
    id: '2',
    name: 'Heavy Transport Package',
    type: 'transport',
    baseRate: 1500,
    unit: 'day',
    description: 'Complete transport solution for heavy machinery',
    isActive: true,
  },
  {
    id: '3',
    name: 'Specialized Rigging Attachment',
    type: 'attachment',
    baseRate: 350,
    unit: 'day',
    description: 'Custom rigging equipment for specialized lifts',
    isActive: false,
  },
];

export function ServicesManagement() {
  const { user } = useAuthStore();
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [filteredServices, setFilteredServices] = useState<Service[]>(INITIAL_SERVICES);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    baseRate: '',
    unit: 'hour' as Service['unit'],
    description: '',
    isActive: true,
  });

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, typeFilter, statusFilter]);

  const filterServices = () => {
    let filtered = [...services];

    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(service => service.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(service => 
        statusFilter === 'active' ? service.isActive : !service.isActive
      );
    }

    setFilteredServices(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.baseRate || !formData.unit) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const newService: Service = {
        id: selectedService?.id || Math.random().toString(36).substring(2, 9),
        name: formData.name,
        type: formData.type,
        baseRate: parseFloat(formData.baseRate),
        unit: formData.unit,
        description: formData.description,
        isActive: formData.isActive,
      };

      if (selectedService) {
        setServices(prev => 
          prev.map(service => 
            service.id === selectedService.id ? newService : service
          )
        );
        showToast('Service updated successfully', 'success');
      } else {
        setServices(prev => [...prev, newService]);
        showToast('Service added successfully', 'success');
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      showToast('Error saving service', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;

    try {
      setServices(prev => prev.filter(service => service.id !== selectedService.id));
      setIsDeleteModalOpen(false);
      setSelectedService(null);
      showToast('Service deleted successfully', 'success');
    } catch (error) {
      showToast('Error deleting service', 'error');
    }
  };

  const handleStatusToggle = (service: Service) => {
    setServices(prev =>
      prev.map(s =>
        s.id === service.id
          ? { ...s, isActive: !s.isActive }
          : s
      )
    );
    showToast(
      `Service ${!service.isActive ? 'activated' : 'deactivated'}`,
      'success'
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      baseRate: '',
      unit: 'hour',
      description: '',
      isActive: true,
    });
    setSelectedService(null);
  };

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  if (!user || (user.role !== 'operations_manager' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <FormInput
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-4">
            <Select
              options={[
                { value: 'all', label: 'All Types' },
                ...SERVICE_TYPES,
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
              className="w-40"
            />

            <Select
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}
              className="w-40"
            />
          </div>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          leftIcon={<Plus size={16} />}
        >
          Add Service
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No services found. Add new services to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <Card key={service.id} variant="bordered" className="h-full">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {SERVICE_TYPES.find(t => t.value === service.type)?.label}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant={service.isActive ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleStatusToggle(service)}
                      >
                        {service.isActive ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-gray-600">{service.description}</p>
                      
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-1 text-primary-600">
                          <IndianRupee className="h-4 w-4" />
                          <span className="font-medium">{formatCurrency(service.baseRate)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>Per {service.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedService(service);
                          setFormData({
                            name: service.name,
                            type: service.type,
                            baseRate: service.baseRate.toString(),
                            unit: service.unit,
                            description: service.description || '',
                            isActive: service.isActive,
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedService(service);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedService ? 'Edit Service' : 'Add New Service'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Service Name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <Select
            label="Service Type"
            options={SERVICE_TYPES}
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Base Rate"
              type="number"
              min="0"
              step="0.01"
              value={formData.baseRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, baseRate: e.target.value }))}
              required
            />

            <Select
              label="Rate Unit"
              options={UNIT_OPTIONS}
              value={formData.unit}
              onChange={(value) => setFormData(prev => ({ ...prev, unit: value as Service['unit'] }))}
              required
            />
          </div>

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Service is active and available for booking
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {selectedService ? 'Update Service' : 'Add Service'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedService(null);
        }}
        title="Delete Service"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this service? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedService(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}