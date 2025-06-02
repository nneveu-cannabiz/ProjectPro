import React from 'react';
import { AlertCircle, ArrowLeft, Bug, RefreshCw, Server, WifiOff } from 'lucide-react';
import Button from './ui/Button';
import { useNavigate } from 'react-router-dom';

interface PageErrorFallbackProps {
  error: Error | null;
  resetError?: () => void;
  pageName?: string;
}

const PageErrorFallback: React.FC<PageErrorFallbackProps> = ({
  error,
  resetError,
  pageName = 'Page',
}) => {
  const navigate = useNavigate();

  // Analyze error message to provide more specific guidance
  const errorType = (() => {
    const message = error?.message?.toLowerCase() || '';
    if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
      return 'network';
    }
    if (message.includes('database') || message.includes('supabase') || message.includes('sql')) {
      return 'database';
    }
    if (message.includes('auth') || message.includes('permission') || message.includes('unauthorized')) {
      return 'auth';
    }
    return 'unknown';
  })();

  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return <WifiOff size={32} className="text-red-500" />;
      case 'database':
        return <Server size={32} className="text-red-500" />;
      case 'auth':
        return <AlertCircle size={32} className="text-red-500" />;
      default:
        return <Bug size={32} className="text-red-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'network':
        return 'Network Error';
      case 'database':
        return 'Database Error';
      case 'auth':
        return 'Authentication Error';
      default:
        return 'Error Loading Page';
    }
  };

  const getErrorHint = () => {
    switch (errorType) {
      case 'network':
        return 'There seems to be an issue with your network connection.';
      case 'database':
        return 'There was a problem connecting to the database or retrieving data.';
      case 'auth':
        return 'You may not have permission to access this resource or your session may have expired.';
      default:
        return 'An unexpected error occurred while loading this page.';
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm mb-6 max-w-3xl mx-auto">
      <div className="flex items-center mb-4">
        {getErrorIcon()}
        <h2 className="text-xl font-semibold text-gray-800 ml-3">
          {getErrorTitle()}
        </h2>
      </div>
      
      <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-6">
        <p className="text-sm text-red-800 font-medium mb-2">{getErrorHint()}</p>
        <p className="text-sm text-red-700">
          Error message: {error?.message || 'Unknown error'}
        </p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-2">
          Failed to load: <span className="text-blue-600">{pageName}</span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          You can still navigate to other parts of the application while we resolve this issue.
        </p>
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-2">Troubleshooting steps:</h4>
          <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
            <li>Check your internet connection</li>
            <li>Verify Supabase credentials in your .env file</li>
            <li>Check browser console for detailed error messages</li>
            <li>Try refreshing the page</li>
            <li>Log out and log back in to refresh your session</li>
          </ul>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft size={16} className="mr-2" />
          Go Back
        </Button>
        {resetError && (
          <Button onClick={resetError}>
            <RefreshCw size={16} className="mr-2" />
            Retry
          </Button>
        )}
        <Button onClick={() => navigate('/projects')} variant="primary">
          Go to Projects
        </Button>
      </div>
    </div>
  );
};

export default PageErrorFallback;