import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
});

// Get user profile from PMA_Users table
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('PMA_Users')
      .select('id, first_name, last_name, email, profile_color, role_id, manager_id, created_at, updated_at')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

// Create or update user profile in PMA_Users table
export const updateUserProfileInDb = async (
  userId: string, 
  userData: { 
    first_name?: string; 
    last_name?: string; 
    email?: string;
    profile_color?: string;
  }
) => {
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('PMA_Users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (existingUser) {
      // Update existing user
      const { error } = await supabase
        .from('PMA_Users')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
    } else {
      // Insert new user
      const { error } = await supabase
        .from('PMA_Users')
        .insert({
          id: userId,
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Test the Supabase connection by making a simple query
export const testSupabaseConnection = async () => {
  try {
    // First check if we have credentials
    if (!supabaseUrl || !supabaseAnonKey) {
      return { 
        success: false, 
        message: 'Missing Supabase credentials. Please check your environment variables.' 
      };
    }
    
    // Add a timeout to the fetch request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 15000);
    });
    
    // Make a simple query to test the connection
    const connectionPromise = supabase
      .from('PMA_Projects')
      .select('id')
      .limit(1);
    
    // Race between the timeout and the actual request
    const { error } = await Promise.race([connectionPromise, timeoutPromise]);
    
    if (error) {
      console.error('Supabase database connection test failed:', error);
      return { 
        success: false, 
        message: `Error: ${error.message || 'Unknown error'}` 
      };
    }
    
    console.log('✅ Supabase connection successful');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Supabase database connection test failed:', error);
    
    // Check if it's a CORS issue
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return { 
        success: false, 
        message: `Network error: This may be due to CORS restrictions or network connectivity.` 
      };
    }
    
    return { 
      success: false, 
      message: `Error: ${errorMessage}` 
    };
  }
};

// Log basic environment info for debugging
export const logEnvironmentInfo = () => {
  console.log('Environment info:');
  console.log(`- Supabase URL defined: ${Boolean(supabaseUrl)}`);
  console.log(`- Supabase Anon Key defined: ${Boolean(supabaseAnonKey)}`);
  console.log(`- Running in development: ${import.meta.env.DEV}`);
  console.log(`- Base URL: ${import.meta.env.BASE_URL}`);
};