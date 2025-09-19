import React, { useState } from 'react';
import { FileText, ExternalLink, Trash2, Pencil } from 'lucide-react';
import Button from '../../../../../../components/ui/Button';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { supabase } from '../../../../../../lib/supabase';

interface ProjectDocumentsSectionProps {
  project: any;
  onUpdateProject: (updatedProject: any) => Promise<void>;
}

const ProjectDocumentsSection: React.FC<ProjectDocumentsSectionProps> = ({
  project,
  onUpdateProject
}) => {
  // Document management state
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [editingDocumentIndex, setEditingDocumentIndex] = useState<number | null>(null);
  const [documentForm, setDocumentForm] = useState({
    document_name: '',
    document_link: '',
    document_description: ''
  });
  const [isUpdatingDocuments, setIsUpdatingDocuments] = useState(false);

  // Direct database update function for documents
  const updateProjectDocuments = async (projectId: string, documents: any[]) => {
    try {
      const { error } = await (supabase as any)
        .from('PMA_Projects')
        .update({ documents: documents })
        .eq('id', projectId);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log('Successfully updated documents in database:', documents);
      return true;
    } catch (error) {
      console.error('Error updating project documents:', error);
      throw error;
    }
  };

  // Document management functions
  const handleAddDocument = () => {
    setDocumentForm({
      document_name: '',
      document_link: '',
      document_description: ''
    });
    setIsAddingDocument(true);
    setIsEditingDocument(false);
    setEditingDocumentIndex(null);
  };

  const handleEditDocument = (index: number) => {
    const documents = project?.documents || [];
    const document = documents[index];
    setDocumentForm({
      document_name: document.document_name || '',
      document_link: document.document_link || '',
      document_description: document.document_description || ''
    });
    setIsEditingDocument(true);
    setIsAddingDocument(false);
    setEditingDocumentIndex(index);
  };

  const handleCancelDocumentEdit = () => {
    setIsAddingDocument(false);
    setIsEditingDocument(false);
    setEditingDocumentIndex(null);
    setDocumentForm({
      document_name: '',
      document_link: '',
      document_description: ''
    });
  };

  const handleSaveDocument = async () => {
    if (!project) {
      alert('Project not found');
      return;
    }

    if (!documentForm.document_name.trim() || !documentForm.document_link.trim()) {
      alert('Document name and link are required');
      return;
    }

    try {
      setIsUpdatingDocuments(true);
      const currentDocuments = project.documents || [];
      let updatedDocuments;

      if (isEditingDocument && editingDocumentIndex !== null) {
        // Edit existing document
        updatedDocuments = [...currentDocuments];
        updatedDocuments[editingDocumentIndex] = {
          document_name: documentForm.document_name.trim(),
          document_link: documentForm.document_link.trim(),
          document_description: documentForm.document_description.trim()
        };
      } else {
        // Add new document
        updatedDocuments = [
          ...currentDocuments,
          {
            document_name: documentForm.document_name.trim(),
            document_link: documentForm.document_link.trim(),
            document_description: documentForm.document_description.trim()
          }
        ];
      }

      console.log('Saving documents to database:', updatedDocuments);

      // Update database directly
      await updateProjectDocuments(project.id, updatedDocuments);

      // Also call the parent update function to refresh the UI
      await onUpdateProject({
        ...project,
        documents: updatedDocuments
      });

      handleCancelDocumentEdit();
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document. Please try again.');
    } finally {
      setIsUpdatingDocuments(false);
    }
  };

  const handleDeleteDocument = async (index: number) => {
    if (!project) {
      alert('Project not found');
      return;
    }

    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setIsUpdatingDocuments(true);
      const currentDocuments = project.documents || [];
      const updatedDocuments = currentDocuments.filter((_: any, i: number) => i !== index);

      console.log('Deleting document, new documents array:', updatedDocuments);

      // Update database directly
      await updateProjectDocuments(project.id, updatedDocuments);

      // Also call the parent update function to refresh the UI
      await onUpdateProject({
        ...project,
        documents: updatedDocuments
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    } finally {
      setIsUpdatingDocuments(false);
    }
  };

  const handleDocumentFormChange = (field: string, value: string) => {
    setDocumentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!project) {
    return (
      <div className="space-y-4">
        <p 
          className="text-xs"
          style={{ color: brandTheme.text.muted }}
        >
          Project not found. Cannot manage documents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        className="flex items-center justify-between px-3 py-2 mb-2 rounded-md"
        style={{ backgroundColor: brandTheme.primary.navy }}
      >
        <h3 
          className="text-sm font-medium"
          style={{ color: brandTheme.background.primary }}
        >
          Documents/Resources
        </h3>
        {!isAddingDocument && !isEditingDocument && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleAddDocument}
            disabled={isUpdatingDocuments}
            style={{
              backgroundColor: brandTheme.primary.lightBlue,
              color: brandTheme.primary.navy,
              borderColor: brandTheme.primary.navy
            }}
          >
            <FileText size={14} className="mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Existing Documents */}
      {project.documents && project.documents.length > 0 && (
        <div className="px-3 space-y-2 mb-3">
          {project.documents.map((document: any, index: number) => (
            <div
              key={index}
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: brandTheme.background.secondary,
                borderColor: brandTheme.border.light
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText size={16} style={{ color: brandTheme.primary.navy }} />
                    <a
                      href={document.document_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline flex items-center"
                      style={{ color: brandTheme.primary.navy }}
                    >
                      {document.document_name}
                      <ExternalLink size={12} className="ml-1" />
                    </a>
                  </div>
                  {document.document_description && (
                    <p 
                      className="text-xs"
                      style={{ color: brandTheme.text.muted }}
                    >
                      {document.document_description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => handleEditDocument(index)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                    disabled={isUpdatingDocuments || isAddingDocument || isEditingDocument}
                    title="Edit document"
                  >
                    <Pencil size={12} style={{ color: brandTheme.text.muted }} />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(index)}
                    className="p-1 rounded hover:bg-red-100 transition-colors"
                    disabled={isUpdatingDocuments || isAddingDocument || isEditingDocument}
                    title="Delete document"
                  >
                    <Trash2 size={12} style={{ color: brandTheme.status.error }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Document Form */}
      {(isAddingDocument || isEditingDocument) && (
        <div 
          className="px-3 p-3 rounded-lg border space-y-3 mb-3"
          style={{ 
            backgroundColor: brandTheme.background.tertiary,
            borderColor: brandTheme.border.medium
          }}
        >
          <div>
            <label 
              className="block text-xs font-medium mb-1"
              style={{ color: brandTheme.text.primary }}
            >
              Document Name *
            </label>
            <input
              type="text"
              value={documentForm.document_name}
              onChange={(e) => handleDocumentFormChange('document_name', e.target.value)}
              placeholder="Enter document name"
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1"
              style={{
                borderColor: brandTheme.border.light,
                backgroundColor: brandTheme.background.primary
              }}
              disabled={isUpdatingDocuments}
            />
          </div>
          
          <div>
            <label 
              className="block text-xs font-medium mb-1"
              style={{ color: brandTheme.text.primary }}
            >
              Document Link *
            </label>
            <input
              type="url"
              value={documentForm.document_link}
              onChange={(e) => handleDocumentFormChange('document_link', e.target.value)}
              placeholder="https://example.com/document"
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1"
              style={{
                borderColor: brandTheme.border.light,
                backgroundColor: brandTheme.background.primary
              }}
              disabled={isUpdatingDocuments}
            />
          </div>
          
          <div>
            <label 
              className="block text-xs font-medium mb-1"
              style={{ color: brandTheme.text.primary }}
            >
              Description (optional)
            </label>
            <textarea
              value={documentForm.document_description}
              onChange={(e) => handleDocumentFormChange('document_description', e.target.value)}
              placeholder="Brief description of the document"
              rows={2}
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 resize-none"
              style={{
                borderColor: brandTheme.border.light,
                backgroundColor: brandTheme.background.primary
              }}
              disabled={isUpdatingDocuments}
            />
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button 
              size="sm" 
              onClick={handleSaveDocument}
              disabled={isUpdatingDocuments || !documentForm.document_name.trim() || !documentForm.document_link.trim()}
              style={{
                backgroundColor: brandTheme.primary.lightBlue,
                color: brandTheme.primary.navy
              }}
            >
              {isUpdatingDocuments ? 'Saving...' : isEditingDocument ? 'Update' : 'Add'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleCancelDocumentEdit}
              disabled={isUpdatingDocuments}
              style={{
                backgroundColor: brandTheme.primary.lightBlue,
                color: brandTheme.primary.navy,
                borderColor: brandTheme.primary.navy
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {(!project.documents || project.documents.length === 0) && !isAddingDocument && !isEditingDocument && (
        <div className="px-3">
          <p 
            className="text-xs"
            style={{ color: brandTheme.text.muted }}
          >
            No documents added yet. Click "Add" to attach documents and resources to this project.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectDocumentsSection;
