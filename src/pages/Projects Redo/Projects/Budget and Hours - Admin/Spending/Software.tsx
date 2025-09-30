import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { 
  fetchPMASpendingByCategory, 
  addPMASpending, 
  updatePMASpending, 
  deletePMASpending,
  fetchProjects 
} from '../../../../../data/supabase-store';
import { PMASpending, Project } from '../../../../../types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Building, 
  Tag, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Monitor
} from 'lucide-react';
import Button from '../../../../../components/ui/Button';
import Modal from '../../../../../components/ui/Modal';
import Input from '../../../../../components/ui/Input';
import Textarea from '../../../../../components/ui/Textarea';
import Select from '../../../../../components/ui/Select';

interface SoftwareFormData {
  name: string;
  description: string;
  purchase_type: 'one_time' | 'recurring';
  amount: number;
  currency: string;
  billing_frequency?: 'monthly' | 'quarterly' | 'yearly' | 'weekly';
  next_billing_date?: string;
  vendor: string;
  vendor_contact: string;
  project_id?: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  notes: string;
  tags: string[];
  is_essential: boolean;
}

const Software: React.FC = () => {
  const { currentUser } = useAuth();
  const [softwareList, setSoftwareList] = useState<PMASpending[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<PMASpending | null>(null);
  const [formData, setFormData] = useState<SoftwareFormData>({
    name: '',
    description: '',
    purchase_type: 'recurring',
    amount: 0,
    currency: 'USD',
    billing_frequency: 'monthly',
    next_billing_date: '',
    vendor: '',
    vendor_contact: '',
    project_id: '',
    status: 'active',
    notes: '',
    tags: [],
    is_essential: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [softwareData, projectsData] = await Promise.all([
        fetchPMASpendingByCategory('software'),
        fetchProjects()
      ]);
      setSoftwareList(softwareData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSoftware = () => {
    setEditingSoftware(null);
    setFormData({
      name: '',
      description: '',
      purchase_type: 'recurring',
      amount: 0,
      currency: 'USD',
      billing_frequency: 'monthly',
      next_billing_date: '',
      vendor: '',
      vendor_contact: '',
      project_id: '',
      status: 'active',
      notes: '',
      tags: [],
      is_essential: false
    });
    setShowModal(true);
  };

  const handleEditSoftware = (software: PMASpending) => {
    setEditingSoftware(software);
    setFormData({
      name: software.name,
      description: software.description || '',
      purchase_type: software.purchase_type,
      amount: software.amount,
      currency: software.currency,
      billing_frequency: software.billing_frequency,
      next_billing_date: software.next_billing_date || '',
      vendor: software.vendor || '',
      vendor_contact: software.vendor_contact || '',
      project_id: software.project_id || '',
      status: software.status,
      notes: software.notes || '',
      tags: software.tags || [],
      is_essential: software.is_essential
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.id) return;

    try {
      const spendingData = {
        name: formData.name,
        description: formData.description,
        category: 'software' as const,
        purchase_type: formData.purchase_type,
        amount: formData.amount,
        currency: formData.currency,
        billing_frequency: formData.purchase_type === 'recurring' ? formData.billing_frequency : undefined,
        next_billing_date: formData.purchase_type === 'recurring' ? formData.next_billing_date : undefined,
        vendor: formData.vendor,
        vendor_contact: formData.vendor_contact,
        project_id: formData.project_id || undefined,
        added_by: currentUser.id,
        status: formData.status,
        notes: formData.notes,
        tags: formData.tags,
        is_essential: formData.is_essential
      };

      if (editingSoftware) {
        await updatePMASpending({ ...spendingData, id: editingSoftware.id, created_at: editingSoftware.created_at, updated_at: editingSoftware.updated_at });
      } else {
        await addPMASpending(spendingData);
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to save software:', error);
    }
  };

  const handleDeleteSoftware = async (id: string) => {
    if (!confirm('Are you sure you want to delete this software entry?')) return;

    try {
      await deletePMASpending(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete software:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'No Project';
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Software Subscriptions & Licenses</h3>
          <p className="text-sm text-gray-600">
            Track software spending including subscriptions and one-time purchases
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleAddSoftware}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Software
        </Button>
      </div>

      {/* Software List */}
      {softwareList.length === 0 ? (
        <div className="text-center py-12">
          <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Software Entries</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first software subscription or license.</p>
          <Button variant="primary" onClick={handleAddSoftware}>
            Add Software
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {softwareList.map((software) => (
            <div key={software.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{software.name}</h4>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(software.status)}`}>
                      {getStatusIcon(software.status)}
                      {software.status}
                    </span>
                    {software.is_essential && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3" />
                        Essential
                      </span>
                    )}
                  </div>
                  
                  {software.description && (
                    <p className="text-gray-600 mb-3">{software.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{formatCurrency(software.amount, software.currency)}</span>
                      {software.purchase_type === 'recurring' && software.billing_frequency && (
                        <span className="text-gray-500">/{software.billing_frequency}</span>
                      )}
                    </div>

                    {software.vendor && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span>{software.vendor}</span>
                      </div>
                    )}

                    {software.next_billing_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Next: {new Date(software.next_billing_date).toLocaleDateString()}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span>{getProjectName(software.project_id)}</span>
                    </div>
                  </div>

                  {software.tags && software.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {software.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSoftware(software)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSoftware(software.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSoftware ? 'Edit Software' : 'Add Software'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Software Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Adobe Creative Cloud"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Type *
              </label>
              <Select
                value={formData.purchase_type}
                onChange={(value) => setFormData({ ...formData, purchase_type: value as 'one_time' | 'recurring' })}
                options={[
                  { value: 'recurring', label: 'Recurring' },
                  { value: 'one_time', label: 'One-time' }
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the software..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <Select
                value={formData.currency}
                onChange={(value) => setFormData({ ...formData, currency: value })}
                options={[
                  { value: 'USD', label: 'USD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'GBP', label: 'GBP' },
                  { value: 'CAD', label: 'CAD' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value as any })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'expired', label: 'Expired' }
                ]}
              />
            </div>
          </div>

          {formData.purchase_type === 'recurring' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Frequency
                </label>
                <Select
                  value={formData.billing_frequency}
                  onChange={(value) => setFormData({ ...formData, billing_frequency: value as any })}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'yearly', label: 'Yearly' },
                    { value: 'weekly', label: 'Weekly' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Billing Date
                </label>
                <Input
                  type="date"
                  value={formData.next_billing_date}
                  onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <Input
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g., Adobe, Microsoft"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Contact
              </label>
              <Input
                value={formData.vendor_contact}
                onChange={(e) => setFormData({ ...formData, vendor_contact: e.target.value })}
                placeholder="support@vendor.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Associated Project
            </label>
            <Select
              value={formData.project_id}
              onChange={(value) => setFormData({ ...formData, project_id: value })}
              options={[
                { value: '', label: 'No Project' },
                ...projects.map((project) => ({
                  value: project.id,
                  label: project.name
                }))
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_essential"
              checked={formData.is_essential}
              onChange={(e) => setFormData({ ...formData, is_essential: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_essential" className="text-sm font-medium text-gray-700">
              Mark as essential service (cannot be cancelled)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingSoftware ? 'Update Software' : 'Add Software'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Software;
