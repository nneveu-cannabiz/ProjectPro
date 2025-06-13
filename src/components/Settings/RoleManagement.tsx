import React, { useState, useEffect } from 'react';
import { Shield, Edit, Trash2, Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';

interface RoleFormProps {
  role?: Role;
  onSubmit: () => void;
  onCancel: () => void;
}

const RoleForm: React.FC<RoleFormProps> = ({ role, onSubmit, onCancel }) => {
  const { addRole, updateRole, refreshData } = useAppContext();
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Role name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      if (role) {
        await updateRole({
          ...role,
          name,
          description,
        });
      } else {
        await addRole({
          name,
          description,
          permissions: {},
          isSystemRole: false,
        });
      }
      
      // Refresh data to ensure UI is updated with latest changes
      await refreshData();
      
      onSubmit();
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Role Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="Enter role name"
        disabled={role?.isSystemRole}
      />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter role description"
        disabled={role?.isSystemRole}
      />

      {role?.isSystemRole && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle size={16} className="text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              This is a system role and cannot be modified.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || role?.isSystemRole}>
          {isSubmitting ? 'Saving...' : (role ? 'Update Role' : 'Create Role')}
        </Button>
      </div>
    </form>
  );
};

const RoleManagement: React.FC = () => {
  const { roles, deleteRole, getUsers, refreshData, isLoading } = useAppContext();
  const { currentUser } = useAuth();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const users = getUsers();
  
  // Check if current user is admin
  const currentUserRole = users.find(u => u.id === currentUser?.id)?.role;
  const canManageRoles = currentUserRole?.name === 'Admin';

  // Auto-refresh data when component mounts or when roles change
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refreshData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [refreshData]);

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setIsFormModalOpen(true);
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (roleToDelete) {
      try {
        await deleteRole(roleToDelete.id);
        
        // Refresh data to ensure UI is updated
        await refreshData();
        
        setIsDeleteModalOpen(false);
        setRoleToDelete(null);
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const handleCloseModal = async () => {
    setIsFormModalOpen(false);
    setEditingRole(null);
    
    // Refresh data when modal closes to ensure latest changes are shown
    await refreshData();
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'Admin':
        return 'critical';
      case 'Manager':
        return 'high';
      case 'Developer':
        return 'primary';
      case 'User':
        return 'default';
      default:
        return 'secondary';
    }
  };

  // Count users for each role
  const getUserCountForRole = (roleId: string) => {
    return users.filter(user => user.roleId === roleId).length;
  };

  if (!canManageRoles) {
    return (
      <div className="text-center py-8">
        <Shield size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Access Restricted</h3>
        <p className="text-gray-500">You need Admin privileges to manage roles.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield size={24} className="mr-3 text-gray-500" />
          <h2 className="text-lg font-semibold">Role Management</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw size={16} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAddRole} size="sm">
            <Plus size={16} className="mr-1" />
            Add Role
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-gray-700">All Roles ({roles.length})</h3>
            {isLoading && (
              <div className="flex items-center text-sm text-gray-500">
                <RefreshCw size={14} className="animate-spin mr-1" />
                Loading...
              </div>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {roles.map((role) => {
            const userCount = getUserCountForRole(role.id);
            
            return (
              <div key={role.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="text-sm font-medium text-gray-900">{role.name}</h4>
                    <Badge variant={getRoleBadgeVariant(role.name)} className="ml-2">
                      {role.isSystemRole ? 'System' : 'Custom'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {role.description || 'No description provided'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {userCount} {userCount === 1 ? 'user' : 'users'} assigned
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRole(role)}
                    className="p-2"
                    title="Edit Role"
                  >
                    <Edit size={16} />
                  </Button>
                  
                  {!role.isSystemRole && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                      className="p-2 text-red-500 hover:text-red-700"
                      title="Delete Role"
                      disabled={userCount > 0}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {roles.length === 0 && !isLoading && (
          <div className="px-6 py-12 text-center">
            <Shield size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Roles Found</h3>
            <p className="text-gray-500">Create your first role to get started.</p>
          </div>
        )}
      </div>

      {/* Role Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
        title={editingRole ? 'Edit Role' : 'Create New Role'}
      >
        <RoleForm
          role={editingRole || undefined}
          onSubmit={handleCloseModal}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Role"
      >
        <div>
          <p className="mb-6">
            Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} size="sm">
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeleteRole} size="sm">
              Delete Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoleManagement;