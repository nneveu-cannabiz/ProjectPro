import React from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface PageErrorViewProps {
  error: Error | null;
  isLoading?: boolean;
  retryFn?: () => void;
  children?: React.ReactNode;
}

/**
 * A component to display errors on a page level while still allowing the page layout to render
 */
const PageErrorView: React.FC<PageErrorViewProps> = ({
  error,
  isLoading = false,
  retryFn,
  children
}) => {
  // If there's no error and we're not loading, render children
  if (!error && !isLoading) {
    return <>{children}</>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {isLoading ? (
            <>
              <Loader2 size={20} className="text-blue-500 animate-spin mr-2" />
              Loading Data...
            </>
          ) : (
            <>
              <AlertCircle size={20} className="text-red-500 mr-2" />
              Error Loading Data
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6">
            <Loader2 size={40} className="text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Please wait while we load your data...</p>
          </div>
        ) : error ? (
          <div>
            <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-4">
              <h3 className="font-medium text-red-800 mb-2">Error Details</h3>
              <p className="text-red-700">{error.message}</p>
            </div>
            
            <p className="mb-4">
              This section encountered an error, but you can still navigate to other parts of the application.
            </p>
            
            {retryFn && (
              <div className="flex justify-center">
                <Button onClick={retryFn}>
                  <RefreshCw size={16} className="mr-2" />
                  Retry
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default PageErrorView;