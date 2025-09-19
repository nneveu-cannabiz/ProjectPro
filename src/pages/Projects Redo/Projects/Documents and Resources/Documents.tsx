import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, FolderOpen, Search, AlertCircle } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { brandTheme } from '../../../../styles/brandTheme';

interface Project {
  id: string;
  name: string;
  description?: string;
  documents?: any; // Can be various formats from JSONB
}

interface Document {
  document_name?: string;
  document_link?: string;
  document_description?: string;
  name?: string; // Alternative name field
  description?: string; // Alternative description field
}

const Documents: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to normalize documents from JSONB
  const getDocumentsArray = (documents?: any): Document[] => {
    if (!documents) return [];
    
    // If it's already an array of objects
    if (Array.isArray(documents)) {
      // Filter out any invalid documents and ensure they have required fields
      return documents.filter(doc => doc && (doc.document_name || doc.document_link));
    }
    
    // If it's a string, try to parse it
    if (typeof documents === 'string') {
      try {
        const parsed = JSON.parse(documents);
        if (Array.isArray(parsed)) {
          return parsed.filter(doc => doc && (doc.document_name || doc.document_link));
        }
        // If it's a single document object
        if (parsed && (parsed.document_name || parsed.document_link)) {
          return [parsed];
        }
        return [];
      } catch (e) {
        console.log('Failed to parse documents string:', e);
        return [];
      }
    }
    
    // If it's an object, it might be a single document
    if (typeof documents === 'object' && documents !== null) {
      // Check if it has document properties
      if (documents.document_name || documents.document_link) {
        return [documents];
      }
      
      // Check if it's an object with nested documents
      if (documents.documents && Array.isArray(documents.documents)) {
        return documents.documents.filter((doc: any) => doc && (doc.document_name || doc.document_link));
      }
    }
    
    return [];
  };

  useEffect(() => {
    fetchProjectsWithDocuments();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm]);

  const fetchProjectsWithDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await (supabase as any)
        .from('PMA_Projects')
        .select('id, name, description, documents')
        .order('name', { ascending: true });

      if (error) throw error;

      console.log('Raw project data:', data);
      console.log('Sample project documents:', data?.[0]?.documents);

      // Filter projects that actually have documents (not empty arrays)
      const projectsWithDocuments = (data || []).filter((project: Project) => {
        const docs = getDocumentsArray(project.documents);
        return docs.length > 0;
      });

      console.log(`Total projects: ${data?.length || 0}, Projects with documents: ${projectsWithDocuments.length}`);
      setProjects(projectsWithDocuments);
    } catch (err: any) {
      console.error('Error fetching projects with documents:', err);
      setError(err.message || 'Failed to load projects with documents');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProjects = () => {
    if (!searchTerm.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = projects.filter(project => {
      // Search in project name
      if (project.name.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in project description
      if (project.description?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in document names and descriptions
      const docs = getDocumentsArray(project.documents);
      return docs.some(doc => 
        (doc.document_name?.toLowerCase().includes(searchLower)) ||
        (doc.document_description?.toLowerCase().includes(searchLower)) ||
        (doc.name?.toLowerCase().includes(searchLower)) ||
        (doc.description?.toLowerCase().includes(searchLower))
      );
    });

    setFilteredProjects(filtered);
  };

  const getTotalDocumentCount = () => {
    return projects.reduce((total, project) => 
      total + getDocumentsArray(project.documents).length, 0
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4" style={{ background: `linear-gradient(135deg, ${brandTheme.primary.paleBlue} 0%, ${brandTheme.background.brandLight} 100%)` }}>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg p-8 text-center" style={{ boxShadow: brandTheme.shadow.xl }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: brandTheme.primary.navy }}></div>
            <p style={{ color: brandTheme.text.secondary }}>Loading documents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-8 px-4" style={{ background: `linear-gradient(135deg, ${brandTheme.primary.paleBlue} 0%, ${brandTheme.background.brandLight} 100%)` }}>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg p-8 text-center" style={{ boxShadow: brandTheme.shadow.xl }}>
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: brandTheme.status.error }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: brandTheme.text.primary }}>Error Loading Documents</h2>
            <p className="mb-4" style={{ color: brandTheme.text.secondary }}>{error}</p>
            <button
              onClick={fetchProjectsWithDocuments}
              className="px-4 py-2 rounded-md text-white transition-colors"
              style={{ backgroundColor: brandTheme.primary.navy }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.interactive.hover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.primary.navy}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: `linear-gradient(135deg, ${brandTheme.primary.paleBlue} 0%, ${brandTheme.background.brandLight} 100%)` }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg mb-6 p-6" style={{ boxShadow: brandTheme.shadow.xl }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8" style={{ color: brandTheme.primary.navy }} />
              <div>
                <h1 className="text-3xl font-bold" style={{ color: brandTheme.text.primary }}>
                  Project Documents & Resources
                </h1>
                <p className="mt-1" style={{ color: brandTheme.text.secondary }}>
                  Browse all documents across {filteredProjects.length} projects ({getTotalDocumentCount()} total documents)
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects and documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                borderColor: brandTheme.border.light,
                color: brandTheme.text.primary
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
              onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
            />
            <Search className="absolute left-3 top-3.5 h-5 w-5" style={{ color: brandTheme.text.muted }} />
          </div>
        </div>

        {/* Projects with Documents */}
        {filteredProjects.length > 0 ? (
          <div className="space-y-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: brandTheme.shadow.xl }}>
                {/* Project Header */}
                <div className="px-6 py-4" style={{ backgroundColor: brandTheme.primary.navy }}>
                  <div className="flex items-center space-x-3">
                    <FolderOpen className="w-6 h-6 text-white" />
                    <div>
                      <h2 className="text-xl font-bold text-white">{project.name}</h2>
                      {project.description && (
                        <p className="mt-1" style={{ color: brandTheme.primary.lightBlue }}>
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="p-6">
                  <div className="space-y-3">
                    {getDocumentsArray(project.documents).map((document, index) => (
                        <div
                          key={index}
                          className="w-full p-4 rounded-lg border transition-shadow hover:shadow-md"
                          style={{ 
                            backgroundColor: brandTheme.background.secondary,
                            borderColor: brandTheme.border.light
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <FileText size={20} className="mt-1 flex-shrink-0" style={{ color: brandTheme.primary.navy }} />
                            <div className="flex-1 min-w-0">
                              <a
                                href={document.document_link || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium hover:underline flex items-center group"
                                style={{ color: brandTheme.primary.navy }}
                              >
                                <span className="truncate">
                                  {document.document_name || document.name || 'Untitled Document'}
                                </span>
                                <ExternalLink size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </a>
                              {(document.document_description || document.description) && (
                                <p 
                                  className="text-sm mt-1"
                                  style={{ color: brandTheme.text.muted }}
                                  title={document.document_description || document.description}
                                >
                                  {document.document_description || document.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center" style={{ boxShadow: brandTheme.shadow.xl }}>
            <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: brandTheme.text.muted }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: brandTheme.text.primary }}>
              {searchTerm ? 'No matching documents found' : 'No documents available'}
            </h2>
            <p style={{ color: brandTheme.text.secondary }}>
              {searchTerm 
                ? `No projects or documents match "${searchTerm}". Try a different search term.`
                : 'No projects currently have documents attached. Documents will appear here when they are added to projects.'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 rounded-md text-white transition-colors"
                style={{ backgroundColor: brandTheme.primary.navy }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.interactive.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.primary.navy}
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
