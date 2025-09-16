export interface DataHygieneKPI {
  id: string;
  name: string;
  current: number;
  target: number;
  unit: string;
  description: string;
  status: 'good' | 'warning' | 'critical';
}

export interface CustomerMetrics {
  totalCustomers: number;
  totalCustomersWithCCALID: number;
  archivedCount: number;
  duplicateRecordsPercent: number;
}

export interface DataHygieneAction {
  id: string;
  lastAttemptDateTime: string;
  assignee: string;
  description: string;
  newMatchedRecords: number;
  notes: string;
}

export const sampleCustomerMetrics: CustomerMetrics = {
  totalCustomers: 15847,
  totalCustomersWithCCALID: 12234,
  archivedCount: 2103,
  duplicateRecordsPercent: 2.8
};

export const sampleDataHygieneKPIs: DataHygieneKPI[] = [
  {
    id: 'matched-customers',
    name: 'Matched Customers %',
    current: Math.round((sampleCustomerMetrics.totalCustomersWithCCALID / sampleCustomerMetrics.totalCustomers) * 100),
    target: 95,
    unit: '%',
    description: 'The % of customers in CustomerList_duplicate that DO have a CCA-L-ID (and is not archived). Total Customers exclude archived customers too.',
    status: 'warning'
  },
  {
    id: 'duplicate-records',
    name: 'Duplicate Records %',
    current: sampleCustomerMetrics.duplicateRecordsPercent,
    target: 1.0,
    unit: '%',
    description: 'Same Member, Same Customer duplicate records percentage',
    status: 'critical'
  }
];

export const sampleDataHygieneActions: DataHygieneAction[] = [
  {
    id: 'action-001',
    lastAttemptDateTime: '2024-01-15 14:30:00',
    assignee: 'Sarah Johnson',
    description: 'Automated customer matching run with improved fuzzy logic',
    newMatchedRecords: 127,
    notes: 'Used enhanced name matching algorithm with 85% confidence threshold'
  },
  {
    id: 'action-002',
    lastAttemptDateTime: '2024-01-12 09:15:00',
    assignee: 'Mike Chen',
    description: 'Manual review and matching of high-priority customer records',
    newMatchedRecords: 43,
    notes: 'Focused on enterprise customers with revenue > $100K'
  },
  {
    id: 'action-003',
    lastAttemptDateTime: '2024-01-10 16:45:00',
    assignee: 'Emily Rodriguez',
    description: 'Duplicate record cleanup and consolidation',
    newMatchedRecords: 0,
    notes: 'Merged 89 duplicate records, no new matches created'
  },
  {
    id: 'action-004',
    lastAttemptDateTime: '2024-01-08 11:20:00',
    assignee: 'David Park',
    description: 'CCA-L-ID backfill for existing customer records',
    newMatchedRecords: 234,
    notes: 'Processed customers from Q4 2023 intake, high success rate'
  }
];

export const calculateOverallDataHygieneScore = (): number => {
  const weights = {
    'matched-customers': 0.70, // Primary metric gets highest weight
    'duplicate-records': 0.30  // Secondary metric
  };

  let totalScore = 0;
  sampleDataHygieneKPIs.forEach(kpi => {
    const weight = weights[kpi.id as keyof typeof weights] || 0;
    if (kpi.id === 'duplicate-records') {
      // For duplicates, lower is better, so invert the score
      const invertedScore = Math.max(0, 100 - (kpi.current / kpi.target) * 100);
      totalScore += invertedScore * weight;
    } else {
      const score = (kpi.current / kpi.target) * 100;
      totalScore += Math.min(100, score) * weight;
    }
  });

  return Math.round(totalScore);
};
