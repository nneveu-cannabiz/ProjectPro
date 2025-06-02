import React, { useState, useRef, useEffect } from 'react';
import { X, User as UserIcon, Save, AlertCircle, Loader2 } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { useAppContext } from '../../context/AppContext';
import { getUserProfile, updateUserProfileInDb } from '../../lib/supabase';

interface UserProfileCardProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: {
    firstName: string;
    lastName: string;
    profileColor: string;
    email: string;
  } | null;
  userId?: string;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ 
  isOpen, 
  onClose,
  userProfile,
  userId 
}) => {
  const { refreshData } = useAppContext();
  const [firstName, setFirstName] = useState(userProfile?.firstName || '');
  const [lastName, setLastName] = useState(userProfile?.lastName || '');
  const [profileColor, setProfileColor] = useState(userProfile?.profileColor || '#2563eb');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Close when clicking outside
  useOnClickOutside(cardRef, isOpen ? onClose : () => {});
  
  // Update form fields when user data changes
  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setProfileColor(userProfile.profileColor || '#2563eb');
    }
  }, [userProfile]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('User ID is missing');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Update in database
      await updateUserProfileInDb(userId, {
        first_name: firstName,
        last_name: lastName,
        profile_color: profileColor
      });
      
      // Refresh data after profile update
      await refreshData();
      
      setSuccessMessage('Profile updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
      <div 
        ref={cardRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col animate-scaleIn overflow-hidden"
        style={{ marginTop: '4rem' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">User Profile</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-blue-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-center mb-6">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-semibold"
              style={{ backgroundColor: profileColor }}
            >
              {firstName && lastName 
                ? `${firstName.charAt(0)}${lastName.charAt(0)}`
                : userProfile?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              icon={<UserIcon size={20} className="text-gray-400" />}
            />
            
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              icon={<UserIcon size={20} className="text-gray-400" />}
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                value={userProfile?.email || ''}
                readOnly
                disabled
                className="bg-gray-50"
              />
            </div>
            
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
            
            {error && (
              <div className="bg-red-50 p-3 rounded-md flex items-start mb-4">
                <AlertCircle size={18} className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-50 p-3 rounded-md flex items-start mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Save size={18} className="mr-2" />
                  Save Profile
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;