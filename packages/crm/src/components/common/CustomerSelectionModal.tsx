import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FormInput } from './FormInput';
import { Customer } from '../../types/lead';
import { getCustomers, createCustomer } from '../../services/firestore/customerService';

type ModalMode = 'select' | 'create';

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  initialCustomerData?: {
    name: string;
    email: string;
    phone: string;
    companyName?: string;
    address?: string;
    designation?: string;
  };
}

export function CustomerSelectionModal({
  isOpen,
  onClose,
  onSelect,
  initialCustomerData
}: CustomerSelectionModalProps) {
  const [mode, setMode] = useState<ModalMode>('select');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: initialCustomerData?.name || '',
    email: initialCustomerData?.email || '',
    phone: initialCustomerData?.phone || '',
    address: initialCustomerData?.address || '',
    companyName: initialCustomerData?.companyName || '',
    designation: initialCustomerData?.designation || ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      setMode('select'); // Reset to select mode when modal opens
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCreateCustomer = async () => {
    if (!formData.name.trim()) {
      alert('Customer Name is required');
      return;
    }
    try {
      const newCustomer = await createCustomer({
        ...formData,
        name: formData.name.trim(),
        companyName: formData.companyName.trim() || 'Korean.org',
        email: formData.email.trim(),
        phone: formData.phone.trim() || 'N/A',
        address: formData.address.trim() || 'N/A',
        designation: formData.designation.trim() || 'N/A'
      });
      console.log('Created new customer:', newCustomer);
      onSelect(newCustomer);
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error creating customer');
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    console.log('Selected existing customer:', customer);
    onSelect(customer);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select or Create Customer"
      size="md"
    >
      <div className="space-y-4">
        {/* Always show the selection buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant={mode === 'select' ? "default" : "outline"}
            onClick={() => setMode('select')}
            className="flex-1"
            size="sm"
          >
            Select Existing
          </Button>
          <Button
            variant={mode === 'create' ? "default" : "outline"}
            onClick={() => {
              setMode('create');
              // Reset form with initial data when switching to create mode
              setFormData({
                name: initialCustomerData?.name || '',
                email: initialCustomerData?.email || '',
                phone: initialCustomerData?.phone || '',
                address: initialCustomerData?.address || '',
                companyName: initialCustomerData?.companyName || '',
                designation: initialCustomerData?.designation || ''
              });
            }}
            className="flex-1"
            size="sm"
          >
            Create New
          </Button>
        </div>

        {mode === 'select' ? (
          <>            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <FormInput
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <button 
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="sr-only">Clear search</span>
                </button>
              )}
            </div><div className="max-h-[60vh] sm:max-h-96 overflow-y-auto border rounded-lg divide-y">
              {isLoading ? (
                <div className="p-3 sm:p-4 text-center text-gray-500 flex items-center justify-center h-20">
                  <svg className="animate-spin h-5 w-5 text-primary-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading customers...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-3 sm:p-4 text-center text-gray-500">
                  {searchTerm ? `No customers matching "${searchTerm}"` : "No customers found"}
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 sm:p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div className="flex flex-col">
                      <div className="font-medium text-sm sm:text-base">{customer.name}</div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        {customer.companyName && (
                          <div className="text-xs sm:text-sm text-gray-600">{customer.companyName}</div>
                        )}
                        {customer.designation && customer.companyName && (
                          <div className="hidden sm:inline-block text-gray-400">•</div>
                        )}
                        {customer.designation && (
                          <div className="text-xs sm:text-sm text-gray-600">{customer.designation}</div>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">{customer.email}</div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-0.5">{customer.customerId}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormInput
                label="Customer Name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter customer name"
                required
              />
              <FormInput
                label="Company Name"
                value={formData.companyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Enter company name"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormInput
                label="Designation"
                value={formData.designation}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                placeholder="Enter designation"
                required
              />
              <FormInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormInput
                label="Phone"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                required
              />
              <FormInput
                label="Address"
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter address"
                required
              />
            </div>            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 sm:pt-2">
              <Button 
                type="button"
                onClick={() => setMode('select')}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCustomer}
                className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
                size="sm"
                leftIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>}
              >
                Add Customer
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}