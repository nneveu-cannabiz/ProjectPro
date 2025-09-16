import React from 'react';
import { BarChart3, Settings, RefreshCw } from 'lucide-react';
import DataHygieneProgress from './Data Hygiene/DataHygieneProgress';

const ProductDevKPIs: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Product Development KPIs</h1>
                <p className="text-gray-600 mt-1">
                  Monitor key performance indicators for product development processes
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Data</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Settings className="w-4 h-4" />
                <span>Configure</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
                Data Hygiene
              </button>
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                Performance Metrics
              </button>
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                Quality Assurance
              </button>
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                Development Velocity
              </button>
            </nav>
          </div>
        </div>

        {/* Data Hygiene Section */}
        <DataHygieneProgress />

        {/* Placeholder for future sections */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <BarChart3 className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">More KPIs Coming Soon</h3>
            <p className="text-gray-500">
              Additional KPI sections will be added as we expand the monitoring capabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDevKPIs;
