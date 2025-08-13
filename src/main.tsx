import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { testSupabaseConnection, logEnvironmentInfo } from './lib/supabase';
import './index.css';

// Test Supabase connection on app startup
console.log('🚀 Starting ProjectPro application...');
logEnvironmentInfo();

testSupabaseConnection().then(result => {
  console.log('🔗 Supabase connection test result:', result);
  if (!result.success) {
    console.error('❌ Supabase connection failed:', result.message);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
