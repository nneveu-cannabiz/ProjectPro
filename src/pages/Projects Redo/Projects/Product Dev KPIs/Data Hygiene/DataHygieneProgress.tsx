import React from 'react';
import { Database, TrendingUp, AlertTriangle, CheckCircle, Users, Archive, Copy, Activity } from 'lucide-react';
import { 
  sampleDataHygieneKPIs, 
  calculateOverallDataHygieneScore, 
  DataHygieneKPI,
  sampleCustomerMetrics,
  sampleDataHygieneActions,
  DataHygieneAction
} from './SampleDataKPIs';
import { brandTheme } from '../../../../../styles/brandTheme';

interface ProgressBarProps {
  value: number;
  target: number;
  status: 'good' | 'warning' | 'critical';
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, target, status, className = '' }) => {
  const percentage = Math.min((value / target) * 100, 100);
  
  const getProgressColors = () => {
    switch (status) {
      case 'good':
        return {
          bar: brandTheme.status.success,
          background: brandTheme.status.successLight
        };
      case 'warning':
        return {
          bar: brandTheme.status.warning,
          background: brandTheme.status.warningLight
        };
      case 'critical':
        return {
          bar: brandTheme.status.error,
          background: brandTheme.status.errorLight
        };
      default:
        return {
          bar: brandTheme.gray[500],
          background: brandTheme.gray[100]
        };
    }
  };

  const colors = getProgressColors();

  return (
    <div className={`w-full ${className}`}>
      <div 
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: colors.bar
          }}
        />
      </div>
    </div>
  );
};

interface KPICardProps {
  kpi: DataHygieneKPI;
}

const KPICard: React.FC<KPICardProps> = ({ kpi }) => {
  const getStatusIcon = () => {
    switch (kpi.status) {
      case 'good':
        return <CheckCircle className="w-5 h-5" style={{ color: brandTheme.status.success }} />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" style={{ color: brandTheme.status.warning }} />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5" style={{ color: brandTheme.status.error }} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="p-4 rounded-lg shadow-sm"
      style={{ 
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.light,
        borderWidth: '1px'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 
          className="text-sm font-medium"
          style={{ color: brandTheme.text.primary }}
        >
          {kpi.name}
        </h4>
        {getStatusIcon()}
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <span 
          className="text-2xl font-bold"
          style={{ color: brandTheme.text.primary }}
        >
          {kpi.current}{kpi.unit}
        </span>
        <span 
          className="text-sm"
          style={{ color: brandTheme.text.muted }}
        >
          Target: {kpi.target}{kpi.unit}
        </span>
      </div>
      
      <ProgressBar 
        value={kpi.current} 
        target={kpi.target} 
        status={kpi.status}
        className="mb-2"
      />
      
      <p 
        className="text-xs"
        style={{ color: brandTheme.text.light }}
      >
        {kpi.description}
      </p>
    </div>
  );
};

interface CustomerMetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  description?: string;
}

const CustomerMetricCard: React.FC<CustomerMetricCardProps> = ({ title, value, icon, iconColor, bgColor, description }) => {
  return (
    <div 
      className="p-4 rounded-lg shadow-sm"
      style={{ 
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.light,
        borderWidth: '1px'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: bgColor }}
        >
          <div style={{ color: iconColor }}>
            {icon}
          </div>
        </div>
        <span 
          className="text-2xl font-bold"
          style={{ color: brandTheme.text.primary }}
        >
          {value.toLocaleString()}
        </span>
      </div>
      <h4 
        className="text-sm font-medium mb-1"
        style={{ color: brandTheme.text.primary }}
      >
        {title}
      </h4>
      {description && (
        <p 
          className="text-xs"
          style={{ color: brandTheme.text.light }}
        >
          {description}
        </p>
      )}
    </div>
  );
};

interface ActionLogItemProps {
  action: DataHygieneAction;
}

const ActionLogItem: React.FC<ActionLogItemProps> = ({ action }) => {
  return (
    <div 
      className="p-4 rounded-lg shadow-sm"
      style={{ 
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.light,
        borderWidth: '1px'
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Activity 
            className="w-4 h-4" 
            style={{ color: brandTheme.primary.navy }}
          />
          <span 
            className="text-sm font-medium"
            style={{ color: brandTheme.text.primary }}
          >
            {action.assignee}
          </span>
        </div>
        <span 
          className="text-xs"
          style={{ color: brandTheme.text.muted }}
        >
          {action.lastAttemptDateTime}
        </span>
      </div>
      
      <h4 
        className="text-sm font-medium mb-1"
        style={{ color: brandTheme.text.primary }}
      >
        {action.description}
      </h4>
      
      <div className="flex items-center justify-between mb-2">
        <span 
          className="text-sm font-medium"
          style={{ color: brandTheme.status.success }}
        >
          +{action.newMatchedRecords} new matches
        </span>
      </div>
      
      <p 
        className="text-xs"
        style={{ color: brandTheme.text.light }}
      >
        {action.notes}
      </p>
    </div>
  );
};

const DataHygieneProgress: React.FC = () => {
  const overallScore = calculateOverallDataHygieneScore();
  const overallStatus = overallScore >= 90 ? 'good' : overallScore >= 75 ? 'warning' : 'critical';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div 
        className="p-6 rounded-lg shadow-sm"
        style={{ 
          backgroundColor: brandTheme.background.primary,
          borderColor: brandTheme.border.light,
          borderWidth: '1px'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: brandTheme.primary.paleBlue }}
            >
              <Database 
                className="w-6 h-6" 
                style={{ color: brandTheme.primary.navy }}
              />
            </div>
            <div>
              <h2 
                className="text-2xl font-bold"
                style={{ color: brandTheme.text.primary }}
              >
                Data Hygiene
              </h2>
              <p style={{ color: brandTheme.text.secondary }}>
                Monitor data quality and integrity metrics
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp 
              className="w-5 h-5" 
              style={{ color: brandTheme.text.light }}
            />
            <span 
              className="text-sm"
              style={{ color: brandTheme.text.muted }}
            >
              Updated 5 min ago
            </span>
          </div>
        </div>

        {/* Primary KPI - Matched Customers Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 
              className="text-lg font-semibold"
              style={{ color: brandTheme.text.primary }}
            >
              Matched Customers %
            </h3>
            <span 
              className="text-2xl font-bold"
              style={{ color: brandTheme.text.primary }}
            >
              {Math.round((sampleCustomerMetrics.totalCustomersWithCCALID / sampleCustomerMetrics.totalCustomers) * 100)}%
            </span>
          </div>
          <ProgressBar 
            value={sampleCustomerMetrics.totalCustomersWithCCALID} 
            target={sampleCustomerMetrics.totalCustomers} 
            status="warning"
            className="mb-2"
          />
          <p 
            className="text-sm"
            style={{ color: brandTheme.text.secondary }}
          >
            The % of customers in CustomerList_duplicate that DO have a CCA-L-ID (and is not archived). Total Customers exclude archived customers too.
          </p>
        </div>
      </div>

      {/* Customer Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CustomerMetricCard
          title="Total Customers"
          value={sampleCustomerMetrics.totalCustomers}
          icon={<Users className="w-6 h-6" />}
          iconColor={brandTheme.primary.navy}
          bgColor={brandTheme.primary.paleBlue}
          description="Excluding archived customers"
        />
        <CustomerMetricCard
          title="Customers with CCA-L-ID"
          value={sampleCustomerMetrics.totalCustomersWithCCALID}
          icon={<CheckCircle className="w-6 h-6" />}
          iconColor={brandTheme.status.success}
          bgColor={brandTheme.status.successLight}
          description="Excluding archived customers"
        />
        <CustomerMetricCard
          title="Archived Count"
          value={sampleCustomerMetrics.archivedCount}
          icon={<Archive className="w-6 h-6" />}
          iconColor={brandTheme.secondary.slate}
          bgColor={brandTheme.gray[100]}
          description="Total archived customer records"
        />
        <CustomerMetricCard
          title="Duplicate Records"
          value={sampleCustomerMetrics.duplicateRecordsPercent}
          icon={<Copy className="w-6 h-6" />}
          iconColor={brandTheme.status.error}
          bgColor={brandTheme.status.errorLight}
          description="Same Member, Same Customer %"
        />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sampleDataHygieneKPIs.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Data Hygiene Actions Taken */}
      <div 
        className="p-6 rounded-lg shadow-sm"
        style={{ 
          backgroundColor: brandTheme.background.primary,
          borderColor: brandTheme.border.light,
          borderWidth: '1px'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 
            className="text-lg font-semibold"
            style={{ color: brandTheme.text.primary }}
          >
            Data Hygiene Actions Taken
          </h3>
          <span 
            className="text-sm"
            style={{ color: brandTheme.text.muted }}
          >
            Recent activity log
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleDataHygieneActions.map((action) => (
            <ActionLogItem key={action.id} action={action} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataHygieneProgress;
