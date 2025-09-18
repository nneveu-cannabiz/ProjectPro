import React, { useState, useRef } from 'react';
import { Upload, X, Image, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { brandTheme } from '../../styles/brandTheme';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string | null) => void;
  currentImageUrl?: string;
  disabled?: boolean;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  currentImageUrl,
  disabled = false,
  maxSizeInMB = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Please upload: ${acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`;
    }

    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return `File size too large. Maximum size is ${maxSizeInMB}MB`;
    }

    return null;
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadError('');

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return null;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `request-attachments/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('pma-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        
        // Handle specific error types
        if (error.message.includes('row-level security') || error.message.includes('Unauthorized')) {
          setUploadError('Storage access not configured. Please contact your administrator.');
        } else if (error.message.includes('Duplicate')) {
          setUploadError('File already exists. Please try again.');
        } else if (error.message.includes('size')) {
          setUploadError(`File too large. Maximum size is ${maxSizeInMB}MB.`);
        } else {
          setUploadError('Failed to upload image. Please try again.');
        }
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pma-attachments')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload image. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    const imageUrl = await uploadImage(file);
    onImageUploaded(imageUrl);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleRemoveImage = () => {
    onImageUploaded(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" style={{ color: brandTheme.text.fieldLabel }}>
        Attach Image (Optional)
      </label>
      
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        } ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: brandTheme.primary.navy }}></div>
            <p className="text-sm" style={{ color: brandTheme.text.secondary }}>
              Uploading image...
            </p>
          </div>
        ) : currentImageUrl ? (
          <div className="space-y-3">
            <div className="relative inline-block">
              <img
                src={currentImageUrl}
                alt="Uploaded attachment"
                className="max-h-32 max-w-full rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute -top-2 -right-2 p-1 rounded-full text-white hover:bg-red-600 transition-colors"
                style={{ backgroundColor: brandTheme.status.error }}
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <Check className="w-4 h-4" style={{ color: brandTheme.status.success }} />
              <p className="text-sm" style={{ color: brandTheme.status.success }}>
                Image uploaded successfully
              </p>
            </div>
            <p className="text-xs" style={{ color: brandTheme.text.muted }}>
              Click to replace or drag a new image here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto" style={{ color: brandTheme.text.muted }} />
            <div>
              <p className="text-sm font-medium" style={{ color: brandTheme.text.primary }}>
                Click to upload or drag and drop
              </p>
              <p className="text-xs" style={{ color: brandTheme.text.muted }}>
                {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to {maxSizeInMB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-start space-x-2 p-3 rounded-md" style={{ backgroundColor: brandTheme.status.errorLight }}>
          <AlertCircle className="w-4 h-4 mt-0.5" style={{ color: brandTheme.status.error }} />
          <p className="text-sm" style={{ color: brandTheme.status.error }}>
            {uploadError}
          </p>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs" style={{ color: brandTheme.text.muted }}>
        You can attach screenshots, error messages, or other relevant images to help us understand your request better.
      </p>
    </div>
  );
};

export default ImageUpload;
