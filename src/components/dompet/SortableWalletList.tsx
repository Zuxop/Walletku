'use client';

import { useState, useCallback } from 'react';
import { GripVertical, Wallet, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { Dompet } from '@/types/database';

// Simple drag and drop without @dnd-kit (to avoid dependency issues)
// Using native HTML5 drag and drop API

interface SortableWalletListProps {
  dompet: Dompet[];
  onReorder: (newOrder: Dompet[]) => void;
  onEdit: (dompet: Dompet) => void;
  onDelete: (id: string) => void;
}

export function SortableWalletList({ dompet, onReorder, onEdit, onDelete }: SortableWalletListProps) {
  const [draggedItem, setDraggedItem] = useState<Dompet | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClient();

  const handleDragStart = (e: React.DragEvent, item: Dompet) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedItem) return;

    const currentIndex = dompet.findIndex(d => d.id === draggedItem.id);
    if (currentIndex === targetIndex) return;

    // Reorder array
    const newOrder = [...dompet];
    const [removed] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    // Update local state immediately for smooth UX
    onReorder(newOrder);

    // Save to database
    setIsUpdating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User tidak terautentikasi');

      // Update all positions
      const updates = newOrder.map((item, index) => ({
        id: item.id,
        urutan: index,
        updated_at: new Date().toISOString(),
      }));

      // Update each wallet position
      for (const update of updates) {
        const { error } = await supabase
          .from('dompet')
          .update({ urutan: update.urutan, updated_at: update.updated_at })
          .eq('id', update.id)
          .eq('user_id', userData.user.id);

        if (error) throw error;
      }

      toast.success('Urutan dompet diperbarui');
    } catch (error) {
      toast.error('Gagal menyimpan urutan');
      // Revert to original order
      onReorder(dompet);
    } finally {
      setIsUpdating(false);
      setDraggedItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // Sort by urutan
  const sortedDompet = [...dompet].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 mb-4">
        Seret dan lepas untuk mengatur urutan dompet
      </p>

      {sortedDompet.map((item, index) => (
        <Card
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            cursor-move transition-all duration-200
            ${draggedItem?.id === item.id ? 'opacity-50' : 'opacity-100'}
            ${dragOverIndex === index ? 'border-indigo-500 border-2' : 'border'}
            ${isUpdating ? 'pointer-events-none' : ''}
          `}
        >
          <CardContent className="p-4 flex items-center gap-3">
            {/* Drag Handle */}
            <div className="p-2 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing">
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>

            {/* Wallet Icon */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: item.warna + '20' }}
            >
              {item.ikon || '💳'}
            </div>

            {/* Wallet Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {item.nama}
              </h3>
              <p className="text-sm text-gray-500">
                {formatRupiah(item.saldo)}
              </p>
            </div>

            {/* Position Number */}
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
              {index + 1}
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(item)}
                className="text-blue-600"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {isUpdating && (
        <div className="text-center py-2 text-sm text-gray-500">
          Menyimpan perubahan...
        </div>
      )}
    </div>
  );
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}
