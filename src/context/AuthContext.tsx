import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Define the context type
interface AuthContextType {
  currentUser: {
    id: string;
    email: string;
    firstName: null;
    lastName: null;
    profileColor: null;
  } | null;
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
  const [currentUser, setCurrentUser] = useState<{
    id: string; 
    email: string;
    firstName: null;
    lastName: null;
    profileColor: null;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for saved session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('Session found:', session.user.id);
          
          // Just set minimal user info from session
          setCurrentUser({
            id: session.user.id,
            email: session.user.email || '',
            firstName: null,
            lastName: null,
            profileColor: null
          });
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
      (event, session) => {
        console.log('Auth state change event:', event);
        
        if (event === 'SIGNED_IN' && session) {
          // Just set minimal user info from session
          setCurrentUser({
            id: session.user.id,
            email: session.user.email || '',
            firstName: null,
            lastName: null,
            profileColor: null
          });
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
      
      // Sign in with Supabase - no profile fetching!
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
        
        // Set minimal user info
        setCurrentUser({
          id: data.user.id,
          email: data.user.email || '',
          firstName: null,
          lastName: null,
          profileColor: null
        });
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        authError,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the context
export const useAuth = () => useContext(AuthContext);