import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getUserProfile } from '../lib/supabase';
import { User } from '../types';

// Define the context type
interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  authError: string | null;
  isLoading: boolean;
  updateUserProfile?: (userData: { firstName?: string; lastName?: string; profileColor?: string }) => Promise<void>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  login: async () => false,
  logout: async () => {},
  authError: null,
  isLoading: false
});

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Function to load complete user profile from PMA_Users
  const loadUserProfile = async (userId: string, email: string) => {
    try {
      console.log('Loading user profile for:', userId);
      
      // Fetch user profile with role information
      const { data: userProfile, error } = await supabase
        .from('PMA_Users')
        .select(`
          id,
          first_name,
          last_name,
          email,
          profile_color,
          role_id,
          manager_id,
          created_at,
          updated_at,
          role:role_id(
            id,
            name,
            description,
            permissions,
            is_system_role,
            created_at,
            updated_at
          ),
          manager:manager_id(
            id,
            first_name,
            last_name,
            email,
            profile_color
          )
        `)
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If user doesn't exist in PMA_Users, create a basic profile
        if (error.code === 'PGRST116') {
          console.log('User not found in PMA_Users, creating basic profile...');
          
          const { error: insertError } = await supabase
            .from('PMA_Users')
            .insert({
              id: userId,
              email: email,
              first_name: '',
              last_name: '',
              profile_color: '#2563eb',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Error creating user profile:', insertError);
          } else {
            console.log('Basic user profile created successfully');
            // Retry fetching the profile
            return loadUserProfile(userId, email);
          }
        }
        
        // Fallback to minimal user data
        const minimalUser: User = {
          id: userId,
          email: email,
          firstName: '',
          lastName: '',
          profileColor: '#2563eb'
        };
        setCurrentUser(minimalUser);
        return minimalUser;
      }
      
      if (userProfile) {
        const fullUser: User = {
          id: userProfile.id,
          email: userProfile.email,
          firstName: userProfile.first_name || '',
          lastName: userProfile.last_name || '',
          profileColor: userProfile.profile_color || '#2563eb',
          roleId: userProfile.role_id || undefined,
          role: userProfile.role ? {
            id: userProfile.role.id,
            name: userProfile.role.name,
            description: userProfile.role.description,
            permissions: userProfile.role.permissions || {},
            isSystemRole: userProfile.role.is_system_role,
            createdAt: userProfile.role.created_at,
            updatedAt: userProfile.role.updated_at
          } : undefined,
          managerId: userProfile.manager_id || undefined,
          manager: userProfile.manager ? {
            id: userProfile.manager.id,
            email: userProfile.manager.email,
            firstName: userProfile.manager.first_name || '',
            lastName: userProfile.manager.last_name || '',
            profileColor: userProfile.manager.profile_color || '#2563eb'
          } : undefined
        };
        
        console.log('User profile loaded successfully:', fullUser);
        setCurrentUser(fullUser);
        return fullUser;
      }
      
      // Fallback to minimal user data
      const minimalUser: User = {
        id: userId,
        email: email,
        firstName: '',
        lastName: '',
        profileColor: '#2563eb'
      };
      setCurrentUser(minimalUser);
      return minimalUser;
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to minimal user data on error
      const minimalUser: User = {
        id: userId,
        email: email,
        firstName: '',
        lastName: '',
        profileColor: '#2563eb'
      };
      setCurrentUser(minimalUser);
      return minimalUser;
    }
  };

  // Check for saved session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('Session found:', session.user.id);
          
          // Load complete user profile from PMA_Users
          await loadUserProfile(session.user.id, session.user.email || '');
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event);
        
        if (event === 'SIGNED_IN' && session) {
          // Load complete user profile from PMA_Users
          await loadUserProfile(session.user.id, session.user.email || '');
          setIsAuthenticated(true);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    );
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function - ONLY use Supabase sign in with password
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthError(null);
      setIsLoading(true);
      
      console.log('Attempting login for:', email);
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error.message);
        setAuthError(`Authentication failed: ${error.message}`);
        return false;
      }
      
      if (data.user) {
        console.log('User authenticated:', data.user.id);
        
        // Load complete user profile from PMA_Users
        await loadUserProfile(data.user.id, data.user.email || '');
        setIsAuthenticated(true);
        return true;
      }
      
      setAuthError('Login failed - please check your credentials');
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Login exception:', errorMessage);
      setAuthError(`Login failed: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile function
  const updateUserProfile = async (userData: { firstName?: string; lastName?: string; profileColor?: string }) => {
    if (!currentUser) return;
    
    try {
      // Update the current user state immediately for UI responsiveness
      const updatedUser: User = {
        ...currentUser,
        firstName: userData.firstName !== undefined ? userData.firstName : currentUser.firstName,
        lastName: userData.lastName !== undefined ? userData.lastName : currentUser.lastName,
        profileColor: userData.profileColor !== undefined ? userData.profileColor : currentUser.profileColor
      };
      
      setCurrentUser(updatedUser);
      
      // Update in database
      const { error } = await supabase
        .from('PMA_Users')
        .update({
          first_name: userData.firstName,
          last_name: userData.lastName,
          profile_color: userData.profileColor,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);
      
      if (error) {
        console.error('Error updating user profile:', error);
        // Revert the optimistic update on error
        setCurrentUser(currentUser);
        throw error;
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        authError,
        isLoading,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the context
export const useAuth = () => useContext(AuthContext);