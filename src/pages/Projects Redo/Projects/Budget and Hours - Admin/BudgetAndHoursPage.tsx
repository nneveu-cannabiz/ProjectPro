import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { isUserAdmin } from '../../../../data/supabase-store';
import { DollarSign, Clock, Shield, AlertCircle } from 'lucide-react';
import HoursOverview from './HoursOverview';
import Button from '../../../../components/ui/Button';

const BudgetAndHoursPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!currentUser?.id) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      try {
        const adminStatus = await isUserAdmin(currentUser.id);
        if (adminStatus) {
          setIsAdmin(true);
          setAccessDenied(false);
        } else {
          setAccessDenied(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [currentUser?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  if (accessDenied || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            This page is restricted to administrators only. You don't have the necessary permissions to view this content.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Budget & Hours</h1>
          <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            Admin Only
          </div>
        </div>
        <p className="text-gray-600">
          Administrative overview of project budgets, time tracking, and resource allocation across all users and projects.
        </p>
      </div>

      {/* Admin Notice */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-900 mb-1">Administrator Access</h3>
          <p className="text-sm text-blue-800">
            You're viewing sensitive administrative data including all user hours, project costs, and budget information. 
            This information should be handled confidentially and in accordance with company policies.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button className="border-b-2 border-blue-500 pb-2 text-sm font-medium text-blue-600">
            Hours Overview
          </button>
          <button className="border-b-2 border-transparent pb-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
            Budget Analysis
            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
          </button>
          <button className="border-b-2 border-transparent pb-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
            Resource Planning
            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
          </button>
          <button className="border-b-2 border-transparent pb-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
            Cost Reports
            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Hours Overview</h2>
        </div>
        
        <HoursOverview />
      </div>

      {/* Future Sections Placeholder */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <h3 className="font-medium text-gray-700 mb-2">Budget Analysis</h3>
          <p className="text-sm text-gray-500">
            Project budget tracking, cost analysis, and financial reporting will be available here.
          </p>
        </div>

        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <h3 className="font-medium text-gray-700 mb-2">Resource Planning</h3>
          <p className="text-sm text-gray-500">
            Team capacity planning, workload distribution, and resource allocation tools.
          </p>
        </div>

        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <h3 className="font-medium text-gray-700 mb-2">Cost Reports</h3>
          <p className="text-sm text-gray-500">
            Detailed cost breakdowns, hourly rate analysis, and profitability reports.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BudgetAndHoursPage;
