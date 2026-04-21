'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTags } from '@/hooks/useTags';
import { toast } from 'react-hot-toast';
import type { Tag } from '@/types/database';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#78716c', '#6b7280'
];

export function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const { tags, loading, addTag, deleteTag } = useTags();
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    
    const result = await addTag(newTagName.trim(), selectedColor);
    if (result.success) {
      toast.success('Tag berhasil dibuat');
      setNewTagName('');
      setIsAdding(false);
      // Auto-select the new tag
      if (result.data?.id) {
        onChange([...selectedTags, result.data.id]);
      }
    } else {
      toast.error(result.error || 'Gagal membuat tag');
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  const handleDeleteTag = async (e: React.MouseEvent, tagId: string) => {
    e.stopPropagation();
    if (confirm('Yakin ingin menghapus tag ini?')) {
      const result = await deleteTag(tagId);
      if (result.success) {
        toast.success('Tag dihapus');
        // Remove from selected if it was selected
        onChange(selectedTags.filter(id => id !== tagId));
      } else {
        toast.error('Gagal menghapus tag');
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2">
        {tags
          ?.filter(tag => selectedTags.includes(tag.id))
          .map(tag => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-sm text-white transition-all hover:opacity-80"
              style={{ backgroundColor: tag.warna }}
            >
              {tag.nama}
              <X className="h-3 w-3" />
            </button>
          ))}
      </div>

      {/* Available Tags */}
      <div className="flex flex-wrap gap-2">
        {tags
          ?.filter(tag => !selectedTags.includes(tag.id))
          .map(tag => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-sm border-2 transition-all hover:bg-gray-50"
              style={{ 
                borderColor: tag.warna,
                color: tag.warna
              }}
            >
              {tag.nama}
              <X 
                className="h-3 w-3 opacity-0 hover:opacity-100" 
                onClick={(e) => handleDeleteTag(e, tag.id)}
              />
            </button>
          ))}
        
        {tags?.filter(tag => !selectedTags.includes(tag.id)).length === 0 && !isAdding && (
          <span className="text-sm text-gray-500 italic">
            {tags?.length === 0 ? 'Belum ada tag' : 'Semua tag sudah dipilih'}
          </span>
        )}
      </div>

      {/* Add New Tag */}
      {isAdding ? (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Input
            placeholder="Nama tag..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTag();
              if (e.key === 'Escape') setIsAdding(false);
            }}
            autoFocus
          />
          <div className="flex gap-1">
            {TAG_COLORS.slice(0, 6).map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full transition-all ${
                  selectedColor === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <Button size="sm" onClick={handleAddTag}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="text-gray-600"
        >
          <Plus className="h-4 w-4 mr-1" />
          Tambah Tag Baru
        </Button>
      )}
    </div>
  );
}
