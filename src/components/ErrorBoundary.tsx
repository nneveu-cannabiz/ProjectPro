import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error, 
      errorInfo: null 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      return this.props.fallback || (
        <div className="p-6 bg-white border border-red-200 rounded-lg shadow-sm m-4">
          <div className="flex items-center mb-4">
            <AlertTriangle size={24} className="text-red-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-800">
              Error Loading {this.props.pageName || 'Page'}
            </h2>
          </div>
          
          <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-4">
            <p className="text-sm text-red-800 font-medium">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.errorInfo && (
              <div className="mt-2">
                <details className="text-xs">
                  <summary className="cursor-pointer text-red-700 hover:text-red-800">
                    View technical details
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-red-700 bg-red-50 p-2 rounded overflow-auto max-h-[300px]">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">What you can do:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Try refreshing the page</li>
              <li>Navigate to another section of the application</li>
              <li>Check your network connection</li>
              <li>Verify your database connection settings</li>
            </ul>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={this.handleReset} 
              className="flex items-center"
            >
              <RefreshCw size={16} className="mr-2" />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;