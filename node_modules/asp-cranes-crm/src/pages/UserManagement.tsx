import React, { useState, useEffect } from 'react';
import { signUp } from '../services/firestore/authService';
import { 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/common/FormInput';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import { RequiredFieldsInfo } from '../components/common/RequiredFieldsInfo';
import { useAuthStore } from '../store/authStore';
import { User as UserType, UserRole } from '../types/auth';

interface ExtendedUser extends Omit<UserType, 'avatar'> {
  status: 'active' | 'inactive';
  avatar?: string;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator' },
  { value: 'sales_agent', label: 'Sales Agent' },
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'operator', label: 'Operator' },
  { value: 'support', label: 'Support' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// Mock initial users
const INITIAL_USERS: ExtendedUser[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@aspcranes.com',
    role: 'admin',
    status: 'active',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    id: '2',
    name: 'John Sales',
    email: 'john@aspcranes.com',
    role: 'sales_agent',
    status: 'active',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    id: '3',
    name: 'Sara Manager',
    email: 'sara@aspcranes.com',
    role: 'operations_manager',
    status: 'active',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    id: '4',
    name: 'Mike Operator',
    email: 'mike@aspcranes.com',
    role: 'operator',
    status: 'inactive',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
];

const ITEMS_PER_PAGE = 10;

export function UserManagement() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<ExtendedUser[]>(INITIAL_USERS);
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUser[]>(INITIAL_USERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator' as UserRole,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.role) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Check for password when adding a new user
    if (!selectedUser && !formData.password) {
      showToast('Password is required for new users', 'error');
      return;
    }

    try {
      if (selectedUser) {
        // For existing users, just update the UI since we don't have password update functionality in this demo
        const updatedUser: ExtendedUser = {
          ...selectedUser,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
        };
        
        setUsers(prev => 
          prev.map(user => 
            user.id === selectedUser.id ? updatedUser : user
          )
        );
        showToast('User updated successfully', 'success');
      } else {
        // For new users, use Firebase Auth to create the account
        try {
          const newUser = await signUp(formData.email, formData.password, formData.name, formData.role);
          
          // Add the new user to our local state with the status
          const extendedUser: ExtendedUser = {
            ...newUser,
            status: formData.status,
            avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          };
          
          setUsers(prev => [...prev, extendedUser]);
          showToast('User added successfully', 'success');
        } catch (authError: any) {
          showToast(`Error creating user account: ${authError.message || 'Unknown error'}`, 'error');
          return;
        }
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      showToast(`Error saving user: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      showToast('User deleted successfully', 'success');
    } catch (error) {
      showToast('Error deleting user', 'error');
    }
  };

  const handleStatusToggle = (user: ExtendedUser) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === user.id
          ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
          : u
      )
    );
    showToast(
      `User ${user.status === 'active' ? 'deactivated' : 'activated'}`,
      'success'
    );
  };
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'operator',
      status: 'active',
    });
    setSelectedUser(null);
  };

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (!user || user.role !== 'admin') {
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-4">
            <Select
              options={[
                { value: 'all', label: 'All Roles' },
                ...ROLE_OPTIONS,
              ]}
              value={roleFilter}
              onChange={(value) => setRoleFilter(value as UserRole | 'all')}
              className="w-40"
            />

            <Select
              options={[
                { value: 'all', label: 'All Status' },
                ...STATUS_OPTIONS,
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as 'active' | 'inactive' | 'all')}
              className="w-40"
            />
          </div>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          leftIcon={<UserPlus size={16} />}
        >
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : paginatedUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No users found matching your filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {ROLE_OPTIONS.find(r => r.value === user.role)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === 'active'
                                ? 'bg-success-100 text-success-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusToggle(user)}
                            >
                              {user.status === 'active' ? (
                                <XCircle size={16} />
                              ) : (
                                <CheckCircle2 size={16} />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);                                setFormData({
                                  name: user.name,
                                  email: user.email,
                                  password: '',  // Empty for editing existing user
                                  role: user.role,
                                  status: user.status,
                                });
                                setIsModalOpen(true);
                              }}
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of{' '}
                    {filteredUsers.length} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit User Modal */}      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedUser ? 'Edit User' : 'Add New User'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <RequiredFieldsInfo />
          <FormInput
            label="Full Name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />          <FormInput
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />

          <FormInput
            label="Password"
            type="password"
            value={formData.password || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required={!selectedUser}
            placeholder={selectedUser ? "Leave blank to keep current password" : ""}
          />

          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={formData.role}
            onChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}
            required
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.status === 'active'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ 
                ...prev, 
                status: e.target.checked ? 'active' : 'inactive' 
              }))}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              User is active
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
              {selectedUser ? 'Update User' : 'Add User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-error-50 text-error-700 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete User
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