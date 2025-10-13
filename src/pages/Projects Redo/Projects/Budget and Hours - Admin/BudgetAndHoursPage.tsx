import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { isUserAdmin } from '../../../../data/supabase-store';
import { DollarSign, Clock, Shield, Monitor } from 'lucide-react';
import HoursOverview from './HoursOverview';
import Software from './Spending/Software';
import ThisMonthSpending from './ThisMonthSpending';
import Button from '../../../../components/ui/Button';
import { brandTheme } from '../../../../styles/brandTheme';

const BudgetAndHoursPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'hours' | 'software'>('hours');

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
      {/* Page Header with Admin Notice in Top Right */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8" style={{ color: brandTheme.status.success }} />
            <h1 className="text-3xl font-bold" style={{ color: brandTheme.text.primary }}>Budget & Hours</h1>
            <div 
              className="ml-2 px-2 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: brandTheme.primary.paleBlue,
                color: brandTheme.primary.navy,
              }}
            >
              Admin Only
            </div>
          </div>
          <p style={{ color: brandTheme.text.secondary }}>
            Administrative overview of project budgets, time tracking, and resource allocation across all users and projects.
          </p>
        </div>

        {/* Admin Notice - Compact Top Right */}
        <div 
          className="px-4 py-3 rounded-lg border flex items-start gap-2 max-w-xs flex-shrink-0"
          style={{
            backgroundColor: brandTheme.primary.paleBlue,
            borderColor: brandTheme.primary.lightBlue,
          }}
        >
          <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: brandTheme.primary.navy }} />
          <div>
            <h3 className="font-semibold text-sm mb-1" style={{ color: brandTheme.primary.navy }}>
              Administrator Access
            </h3>
            <p className="text-xs" style={{ color: brandTheme.text.secondary }}>
              Viewing sensitive administrative data. Handle confidentially.
            </p>
          </div>
        </div>
      </div>

      {/* This Month Summary - Always Visible */}
      <div className="mb-6">
        <ThisMonthSpending />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button 
            className="border-b-2 pb-2 text-sm font-medium transition-colors"
            style={{
              borderColor: activeTab === 'hours' ? brandTheme.primary.navy : 'transparent',
              color: activeTab === 'hours' ? brandTheme.primary.navy : brandTheme.text.muted,
            }}
            onClick={() => setActiveTab('hours')}
            onMouseEnter={(e) => {
              if (activeTab !== 'hours') {
                e.currentTarget.style.color = brandTheme.text.secondary;
                e.currentTarget.style.borderColor = brandTheme.border.medium;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'hours') {
                e.currentTarget.style.color = brandTheme.text.muted;
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Hours Overview
          </button>
          <button 
            className="border-b-2 pb-2 text-sm font-medium transition-colors"
            style={{
              borderColor: activeTab === 'software' ? brandTheme.primary.navy : 'transparent',
              color: activeTab === 'software' ? brandTheme.primary.navy : brandTheme.text.muted,
            }}
            onClick={() => setActiveTab('software')}
            onMouseEnter={(e) => {
              if (activeTab !== 'software') {
                e.currentTarget.style.color = brandTheme.text.secondary;
                e.currentTarget.style.borderColor = brandTheme.border.medium;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'software') {
                e.currentTarget.style.color = brandTheme.text.muted;
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            <Monitor className="w-4 h-4 inline mr-2" />
            Software
          </button>
          <button 
            className="border-b-2 border-transparent pb-2 text-sm font-medium"
            style={{ color: brandTheme.text.muted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = brandTheme.text.secondary;
              e.currentTarget.style.borderColor = brandTheme.border.medium;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = brandTheme.text.muted;
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            Budget Analysis
            <span 
              className="ml-2 text-xs px-2 py-1 rounded"
              style={{ backgroundColor: brandTheme.background.secondary, color: brandTheme.text.muted }}
            >
              Coming Soon
            </span>
          </button>
          <button 
            className="border-b-2 border-transparent pb-2 text-sm font-medium"
            style={{ color: brandTheme.text.muted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = brandTheme.text.secondary;
              e.currentTarget.style.borderColor = brandTheme.border.medium;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = brandTheme.text.muted;
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            Resource Planning
            <span 
              className="ml-2 text-xs px-2 py-1 rounded"
              style={{ backgroundColor: brandTheme.background.secondary, color: brandTheme.text.muted }}
            >
              Coming Soon
            </span>
          </button>
          <button 
            className="border-b-2 border-transparent pb-2 text-sm font-medium"
            style={{ color: brandTheme.text.muted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = brandTheme.text.secondary;
              e.currentTarget.style.borderColor = brandTheme.border.medium;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = brandTheme.text.muted;
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            Cost Reports
            <span 
              className="ml-2 text-xs px-2 py-1 rounded"
              style={{ backgroundColor: brandTheme.background.secondary, color: brandTheme.text.muted }}
            >
              Coming Soon
            </span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div 
        className="rounded-lg border p-6"
        style={{
          backgroundColor: brandTheme.background.primary,
          borderColor: brandTheme.border.light,
        }}
      >
        {activeTab === 'hours' ? (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-6 h-6" style={{ color: brandTheme.primary.navy }} />
              <h2 className="text-xl font-semibold" style={{ color: brandTheme.text.primary }}>Hours Overview</h2>
            </div>
            <HoursOverview />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Monitor className="w-6 h-6" style={{ color: brandTheme.primary.navy }} />
              <h2 className="text-xl font-semibold" style={{ color: brandTheme.text.primary }}>Software Spending</h2>
            </div>
            <Software />
          </>
        )}
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
