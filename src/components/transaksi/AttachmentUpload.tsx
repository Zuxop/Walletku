'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

interface AttachmentUploadProps {
  transactionId?: string;
  attachments?: string[];
  onUpload?: (urls: string[]) => void;
  readOnly?: boolean;
}

export function AttachmentUpload({ 
  transactionId, 
  attachments = [], 
  onUpload,
  readOnly = false 
}: AttachmentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<string[]>(attachments);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(selectedFiles)) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} terlalu besar (max 5MB)`);
          continue;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`Format file ${file.name} tidak didukung`);
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) {
          toast.error(`Gagal upload ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        const newFiles = [...files, ...uploadedUrls];
        setFiles(newFiles);
        onUpload?.(newFiles);
        toast.success(`${uploadedUrls.length} file berhasil diupload`);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (url: string) => {
    try {
      // Extract file path from URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('attachments') + 1).join('/');

      // Delete from storage
      await supabase.storage.from('attachments').remove([filePath]);

      // Update state
      const newFiles = files.filter(f => f !== url);
      setFiles(newFiles);
      onUpload?.(newFiles);
      toast.success('File dihapus');
    } catch (error) {
      toast.error('Gagal menghapus file');
    }
  };

  const getFileIcon = (url: string) => {
    if (url.endsWith('.pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    return <ImageIcon className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,.pdf"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Mengupload...' : 'Upload Lampiran'}
          </Button>
          <span className="text-xs text-gray-500">Max 5MB (JPEG, PNG, PDF)</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((url, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border group"
            >
              {getFileIcon(url)}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline truncate max-w-[150px]"
              >
                Lampiran {index + 1}
              </a>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple display component for transaction list
export function AttachmentIndicator({ count }: { count: number }) {
  if (count === 0) return null;
  
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <Paperclip className="h-3 w-3" />
      <span>{count}</span>
    </div>
  );
}
