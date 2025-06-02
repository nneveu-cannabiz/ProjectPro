import React, { useState, useRef } from 'react';
import { User } from '../types';
import UserAvatar from './UserAvatar';
import { useOnClickOutside } from '../hooks/useOnClickOutside';

interface UserSelectProps {
  label?: string;
  selectedUserId?: string;
  onChange: (userId: string) => void;
  users: User[];
  error?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

const UserSelect: React.FC<UserSelectProps> = ({
  label,
  selectedUserId,
  onChange,
  users,
  error,
  className = '',
  placeholder = 'Select assignee',
  required = false
}) => {
  const selectId = label?.toLowerCase().replace(/\s+/g, '-');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useOnClickOutside(dropdownRef, () => setIsOpen(false));
  
  // Get selected user for display
  const selectedUser = selectedUserId 
    ? users.find(user => user.id === selectedUserId) 
    : undefined;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Custom select button that looks like a select input */}
        <div 
          className={`w-full px-3 py-2 border rounded-md shadow-sm 
            ${error ? 'border-red-500' : 'border-gray-300'}
            bg-white flex items-center justify-between cursor-pointer`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedUser ? (
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                style={{ backgroundColor: selectedUser.profileColor || '#2563eb' }}
              />
              <span>
                {selectedUser.firstName && selectedUser.lastName
                  ? `${selectedUser.firstName} ${selectedUser.lastName}`
                  : selectedUser.email}
              </span>
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          
          <div className="pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 20 20" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>
        
        {/* Dropdown with user list */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-white rounded-md border border-gray-200 shadow-lg">
            <div className="py-1">
              <div 
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
              >
                <span className="text-gray-500">{placeholder}</span>
              </div>
              
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${
                    selectedUserId === user.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    onChange(user.id);
                    setIsOpen(false);
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: user.profileColor || '#2563eb' }}
                  />
                  <span className="font-medium">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default UserSelect;