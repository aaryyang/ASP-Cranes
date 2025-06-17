import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Settings, Calendar, Weight, Plane as Crane, IndianRupee, Truck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/common/FormInput';
import { Select } from '../components/common/Select';
import { TextArea } from '../components/common/TextArea';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import { Badge } from '../components/common/Badge';
import { useAuthStore } from '../store/authStore';
import { Equipment, CraneCategory, OrderType, BaseRates } from '../types/equipment';
import { getEquipment, createEquipment, updateEquipment, deleteEquipment } from '../services/firestore/equipmentService';
import { formatCurrency } from '../utils/formatters';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In Use' },
  { value: 'maintenance', label: 'Maintenance' },
];

const CATEGORY_OPTIONS = [
  { value: 'mobile_crane', label: 'Mobile Crane' },
  { value: 'tower_crane', label: 'Tower Crane' },
  { value: 'crawler_crane', label: 'Crawler Crane' },
  { value: 'pick_and_carry_crane', label: 'Pick & Carry Crane' },
];

const ORDER_TYPES = [
  { value: 'micro', label: 'Micro' },
  { value: 'small', label: 'Small' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

const RATE_LABELS = {
  micro: 'per hour',
  small: 'per hour',
  monthly: 'per month',
  yearly: 'per month'
} as const;

export function EquipmentManagement() {
  const { user } = useAuthStore();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Equipment['status']>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CraneCategory>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const [formData, setFormData] = useState({
    name: '',
    category: 'mobile_crane' as CraneCategory,
    manufacturingDate: '',
    registrationDate: '',
    maxLiftingCapacity: '',
    unladenWeight: '',
    baseRates: {
      micro: '',
      small: '',
      monthly: '',
      yearly: '',
    },
    runningCostPerKm: '',
    description: '',
    status: 'available' as Equipment['status'],
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    filterEquipment();
  }, [equipment, searchTerm, statusFilter, categoryFilter]);

  const fetchEquipment = async () => {
    try {
      const data = await getEquipment();
      setEquipment(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showToast('Error fetching equipment', 'error');
    }
  };

  const filterEquipment = () => {
    let filtered = [...equipment];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    setFilteredEquipment(filtered);
  };

  const validateForm = () => {
    if (!formData.name || !formData.manufacturingDate || !formData.registrationDate || 
        !formData.maxLiftingCapacity || !formData.unladenWeight || !formData.runningCostPerKm ||
        !formData.baseRates.micro || !formData.baseRates.small || 
        !formData.baseRates.monthly || !formData.baseRates.yearly) {
      showToast('Please fill in all required fields', 'error');
      return false;
    }

    // Validate date formats (YYYY-MM)
    const dateRegex = /^\d{4}-\d{2}$/;
    if (!dateRegex.test(formData.manufacturingDate) || !dateRegex.test(formData.registrationDate)) {
      showToast('Please enter valid dates in YYYY-MM format', 'error');
      return false;
    }

    // Validate numeric fields
    if (isNaN(Number(formData.maxLiftingCapacity)) || isNaN(Number(formData.unladenWeight)) ||
        isNaN(Number(formData.runningCostPerKm)) ||
        isNaN(Number(formData.baseRates.micro)) || isNaN(Number(formData.baseRates.small)) ||
        isNaN(Number(formData.baseRates.monthly)) || isNaN(Number(formData.baseRates.yearly))) {
      showToast('Please enter valid numbers for numeric fields', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const equipmentData = {
        ...formData,
        maxLiftingCapacity: Number(formData.maxLiftingCapacity),
        unladenWeight: Number(formData.unladenWeight),
        baseRates: {
          micro: Number(formData.baseRates.micro),
          small: Number(formData.baseRates.small),
          monthly: Number(formData.baseRates.monthly),
          yearly: Number(formData.baseRates.yearly),
        } as BaseRates,
        runningCost: Number(formData.runningCostPerKm),
        runningCostPerKm: Number(formData.runningCostPerKm),
      };

      if (selectedEquipment) {
        const updatedEquipment = await updateEquipment(selectedEquipment.id, equipmentData);
        setEquipment(prev => 
          prev.map(item => 
            item.id === selectedEquipment.id ? { ...item, ...updatedEquipment } : item
          )
        );
        showToast('Equipment updated successfully', 'success');
      } else {
        const newEquipment = await createEquipment(equipmentData);
        setEquipment(prev => [...prev, newEquipment]);
        showToast('Equipment added successfully', 'success');
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      showToast('Error saving equipment', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedEquipment) return;

    try {
      await deleteEquipment(selectedEquipment.id);
      setEquipment(prev => prev.filter(item => item.id !== selectedEquipment.id));
      setIsDeleteModalOpen(false);
      setSelectedEquipment(null);
      showToast('Equipment deleted successfully', 'success');
    } catch (error) {
      showToast('Error deleting equipment', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'mobile_crane' as CraneCategory,
      manufacturingDate: '',
      registrationDate: '',
      maxLiftingCapacity: '',
      unladenWeight: '',
      baseRates: {
        micro: '',
        small: '',
        monthly: '',
        yearly: '',
      },
      runningCostPerKm: '',
      description: '',
      status: 'available',
    });
    setSelectedEquipment(null);
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <FormInput
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-4">
            <Select
              value={categoryFilter}
              onChange={(value) => setCategoryFilter(value as 'all' | CraneCategory)}
              options={[
                { value: 'all', label: 'All Categories' },
                ...CATEGORY_OPTIONS,
              ]}
              className="w-48"
            />
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as 'all' | Equipment['status'])}
              options={[
                { value: 'all', label: 'All Status' },
                ...STATUS_OPTIONS,
              ]}
              className="w-48"
            />
          </div>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Equipment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading equipment...</div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No equipment found. Add new equipment to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specifications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEquipment.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.equipmentId}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <Badge variant="secondary" className="w-full justify-center">
                            {CATEGORY_OPTIONS.find(opt => opt.value === item.category)?.label}
                          </Badge>
                          <Badge
                            variant={
                              item.status === 'available' ? 'success' :
                              item.status === 'in_use' ? 'warning' :
                              'error'
                            }
                            className="w-full justify-center"
                          >
                            {STATUS_OPTIONS.find(opt => opt.value === item.status)?.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Mfg: {item.manufacturingDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Weight className="h-4 w-4 text-gray-400" />
                            <span>{item.maxLiftingCapacity} tons max lift</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Crane className="h-4 w-4 text-gray-400" />
                            <span>{item.unladenWeight} tons unladen</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[300px]">
                        <div className="text-sm">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="font-medium text-gray-900 mb-3">Base Rates</div>
                            <div className="space-y-2.5">
                              {ORDER_TYPES.map(type => (
                                <div key={type.value} className="grid grid-cols-[100px,1fr] items-baseline">
                                  <span className="text-gray-600">{type.label}</span>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-gray-400 text-sm">₹</span>
                                    <span className="text-gray-900 font-medium">
                                      {formatCurrency(item.baseRates[type.value])}
                                    </span>
                                    <span className="text-gray-500 text-sm">
                                      {type.value === 'monthly' || type.value === 'yearly' ? (
                                        <div>per<br />month</div>
                                      ) : (
                                        'per hour'
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-gray-600">
                            <Truck className="h-4 w-4" />
                            <span>Running:</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-gray-400">₹</span>
                              <span className="text-gray-900">{formatCurrency(item.runningCostPerKm)}</span>
                              <span className="text-gray-500">/km</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEquipment(item);
                              setFormData({
                                name: item.name,
                                category: item.category,
                                manufacturingDate: item.manufacturingDate,
                                registrationDate: item.registrationDate,
                                maxLiftingCapacity: String(item.maxLiftingCapacity),
                                unladenWeight: String(item.unladenWeight),
                                baseRates: {
                                  micro: String(item.baseRates.micro),
                                  small: String(item.baseRates.small),
                                  monthly: String(item.baseRates.monthly),
                                  yearly: String(item.baseRates.yearly),
                                },
                                runningCostPerKm: String(item.runningCostPerKm),
                                description: item.description || '',
                                status: item.status,
                              });
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error-600 hover:text-error-700 hover:bg-error-50"
                            onClick={() => {
                              setSelectedEquipment(item);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        title={selectedEquipment ? 'Edit Equipment' : 'Add Equipment'}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <FormInput
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <FormInput
              label="Max Lifting Capacity (tons)"
              type="number"
              value={formData.maxLiftingCapacity}
              onChange={(e) => setFormData({ ...formData, maxLiftingCapacity: e.target.value })}
              required
            />

            <Select
              label="Category"
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value as CraneCategory })}
              options={CATEGORY_OPTIONS}
              className="w-full"
            />

            <FormInput
              label="Unladen Weight (tons)"
              type="number"
              value={formData.unladenWeight}
              onChange={(e) => setFormData({ ...formData, unladenWeight: e.target.value })}
              required
            />

            <FormInput
              label="Manufacturing Date (YYYY-MM)"
              value={formData.manufacturingDate}
              onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
              placeholder="YYYY-MM"
              required
            />

            <FormInput
              label="Running Cost (₹/km)"
              type="number"
              value={formData.runningCostPerKm}
              onChange={(e) => setFormData({ ...formData, runningCostPerKm: e.target.value })}
              required
            />

            <FormInput
              label="Registration Date (YYYY-MM)"
              value={formData.registrationDate}
              onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
              placeholder="YYYY-MM"
              required
            />

            <Select
              label="Status"
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value as Equipment['status'] })}
              options={STATUS_OPTIONS}
              className="w-full"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-base font-medium text-gray-900">Base Rates</h4>
            <div className="grid grid-cols-2 gap-8">
              <FormInput
                label="Micro Rate (₹ per hour)"
                type="number"
                value={formData.baseRates.micro}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    baseRates: {
                      ...formData.baseRates,
                      micro: e.target.value,
                    },
                  })
                }
                required
              />

              <FormInput
                label="Small Rate (₹ per hour)"
                type="number"
                value={formData.baseRates.small}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    baseRates: {
                      ...formData.baseRates,
                      small: e.target.value,
                    },
                  })
                }
                required
              />

              <FormInput
                label="Monthly Rate (₹ per month)"
                type="number"
                value={formData.baseRates.monthly}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    baseRates: {
                      ...formData.baseRates,
                      monthly: e.target.value,
                    },
                  })
                }
                required
              />

              <FormInput
                label="Yearly Rate (₹ per month)"
                type="number"
                value={formData.baseRates.yearly}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    baseRates: {
                      ...formData.baseRates,
                      yearly: e.target.value,
                    },
                  })
                }
                required
              />
            </div>
          </div>

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

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
              {selectedEquipment ? 'Update Equipment' : 'Add Equipment'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Delete Equipment"
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedEquipment(null);
        }}
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this equipment? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedEquipment(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Equipment
            </Button>
          </div>
        </div>
      </Modal>

      <Toast
        title={toast.title}
        variant={toast.variant}
        isVisible={toast.show}
        onClose={() => setToast({ show: false, title: '' })}
      />
    </div>
  );
}