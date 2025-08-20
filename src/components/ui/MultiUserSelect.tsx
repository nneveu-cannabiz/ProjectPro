import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Users } from 'lucide-react';
import { User } from '../../types';
import UserAvatar from '../UserAvatar';
import { brandTheme } from '../../styles/brandTheme';

interface MultiUserSelectProps {
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
  users: User[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
}

const MultiUserSelect: React.FC<MultiUserSelectProps> = ({
  selectedUserIds,
  onChange,
  users,
  placeholder = "Select users...",
  className = "",
  disabled = false,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const availableUsers = users.filter(user => !selectedUserIds.includes(user.id));

  const handleUserToggle = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    onChange(selectedUserIds.filter(id => id !== userId));
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label 
          className="block text-sm font-medium mb-2"
          style={{ color: brandTheme.text.primary }}
        >
          {label}
        </label>
      )}
      
      <div ref={dropdownRef}>
        {/* Selected Users Display */}
        <div
          className={`min-h-[40px] p-2 border rounded-lg cursor-pointer transition-colors ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-blue-300'
          }`}
          style={{
            borderColor: brandTheme.border.light,
            backgroundColor: disabled ? brandTheme.background.secondary : brandTheme.background.primary
          }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {selectedUsers.length === 0 ? (
                <span 
                  className="text-sm"
                  style={{ color: brandTheme.text.muted }}
                >
                  {placeholder}
                </span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectedUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                      style={{ 
                        backgroundColor: brandTheme.primary.paleBlue,
                        color: brandTheme.primary.navy
                      }}
                    >
                      <UserAvatar user={user} size="xs" className="mr-1" />
                      <span className="mr-1">{getUserDisplayName(user)}</span>
                      {!disabled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveUser(user.id);
                          }}
                          className="hover:bg-blue-200 rounded p-0.5"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {!disabled && (
              <ChevronDown 
                size={16} 
                className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                style={{ color: brandTheme.text.muted }}
              />
            )}
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div
            className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
            style={{ 
              borderColor: brandTheme.border.light,
              backgroundColor: brandTheme.background.primary
            }}
          >
            {availableUsers.length === 0 ? (
              <div 
                className="p-3 text-center text-sm"
                style={{ color: brandTheme.text.muted }}
              >
                {users.length === 0 ? 'No users available' : 'All users selected'}
              </div>
            ) : (
              availableUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleUserToggle(user.id)}
                  style={{ 
                    '&:hover': { backgroundColor: brandTheme.background.secondary }
                  }}
                >
                  <UserAvatar user={user} size="sm" className="mr-2" />
                  <div className="flex-1">
                    <div 
                      className="font-medium text-sm"
                      style={{ color: brandTheme.text.primary }}
                    >
                      {getUserDisplayName(user)}
                    </div>
                    <div 
                      className="text-xs"
                      style={{ color: brandTheme.text.muted }}
                    >
                      {user.email}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiUserSelect;