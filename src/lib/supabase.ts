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
    detectSessionInUrl: false
  },
});

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