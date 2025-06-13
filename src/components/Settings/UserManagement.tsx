import React, { useState } from 'react';
import { Users, Edit, Trash2, UserPlus, Shield, Mail, User as UserIcon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { User, Role } from '../../types';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import UserAvatar from '../UserAvatar';

interface UserFormProps {
  user?: User;
  onSubmit: () => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  const { roles, updateUser } = useAppContext();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [roleId, setRoleId] = useState(user?.roleId || '');
  const [profileColor, setProfileColor] = useState(user?.profileColor || '#2563eb');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = roles.map(role => ({
    value: role.id,
    label: role.name
  }));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!roleId) {
      newErrors.roleId = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate() || !user) return;
    
    setIsSubmitting(true);
    
    try {
      await updateUser(user.id, {
        firstName,
        lastName,
        roleId,
        profileColor
      });
      
      onSubmit();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <Input
          value={user?.email || ''}
          disabled
          className="bg-gray-50"
        />
      </div>

      <Input
        label="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        error={errors.firstName}
        placeholder="Enter first name"
        icon={<UserIcon size={20} className="text-gray-400" />}
      />

      <Input
        label="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        error={errors.lastName}
        placeholder="Enter last name"
        icon={<UserIcon size={20} className="text-gray-400" />}
      />

      <Select
        label="Role"
        options={roleOptions}
        value={roleId}
        onChange={setRoleId}
        error={errors.roleId}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profile Color
        </label>
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-full border border-gray-300"
            style={{ backgroundColor: profileColor }}
          ></div>
          <input
            type="color"
            value={profileColor}
            onChange={(e) => setProfileColor(e.target.value)}
            className="w-full h-10 cursor-pointer"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

const UserManagement: React.FC = () => {
  const { getUsers, roles } = useAppContext();
  const { currentUser } = useAuth();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const users = getUsers();
  
  // Check if current user is admin or manager
  const currentUserRole = users.find(u => u.id === currentUser?.id)?.role;
  const canManageUsers = currentUserRole?.name === 'Admin' || currentUserRole?.name === 'Manager';

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
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

  if (!canManageUsers) {
    return (
      <div className="text-center py-8">
        <Shield size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Access Restricted</h3>
        <p className="text-gray-500">You need Admin or Manager privileges to manage users.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users size={24} className="mr-3 text-gray-500" />
          <h2 className="text-lg font-semibold">User Management</h2>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-md font-medium text-gray-700">All Users ({users.length})</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {users.map((user) => (
            <div key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center flex-1">
                <UserAvatar user={user} size="md" />
                <div className="ml-4">
                  <div className="flex items-center">
                    <h4 className="text-sm font-medium text-gray-900">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : 'Unnamed User'}
                    </h4>
                    {user.id === currentUser?.id && (
                      <Badge variant="primary" className="ml-2 text-xs">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center mt-1">
                    <Mail size={14} className="text-gray-400 mr-1" />
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Badge variant={getRoleBadgeVariant(user.role?.name || 'User')}>
                  {user.role?.name || 'User'}
                </Badge>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditUser(user)}
                  className="p-2"
                  title="Edit User"
                >
                  <Edit size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Users Found</h3>
            <p className="text-gray-500">Users will appear here once they sign up.</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title="Edit User"
      >
        {editingUser && (
          <UserForm
            user={editingUser}
            onSubmit={handleCloseModal}
            onCancel={handleCloseModal}
          />
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;