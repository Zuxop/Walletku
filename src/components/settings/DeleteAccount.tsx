'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export function DeleteAccount() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [confirmations, setConfirmations] = useState({
    understand: false,
    dataLoss: false,
    noRecovery: false,
  });

  const canDelete =
    confirmText.toLowerCase() === 'hapus akun' &&
    confirmations.understand &&
    confirmations.dataLoss &&
    confirmations.noRecovery;

  const handleDelete = async () => {
    if (!user || !canDelete) return;

    setIsDeleting(true);
    const supabase = createClient();
    try {
      // Delete user data from all tables
      const tables = [
        'kontribusi_tujuan',
        'tujuan_keuangan',
        'cicilan_hutang',
        'hutang_piutang',
        'transaksi_tags',
        'transaksi',
        'recurring_rules',
        'budgets',
        'dompet',
        'kategori',
        'tags',
      ];

      for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq('user_id', user.id);
        if (error) console.error(`Error deleting from ${table}:`, error);
      }

      // Delete profile
      await supabase.from('profiles').delete().eq('id', user.id);

      // Delete auth user (this will trigger cascade delete)
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) {
        // Fallback: sign out and let user delete manually
        console.error('Auth delete error:', authError);
      }

      // Clear local storage and sign out
      localStorage.clear();
      sessionStorage.clear();
      signOut();

      toast.success('Akun Anda telah dihapus');
      window.location.href = '/';
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Gagal menghapus akun. Silakan hubungi support.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Hapus Akun
          </CardTitle>
          <CardDescription className="text-red-600/80">
            Hapus akun Anda secara permanen. Tindakan ini tidak dapat dibatalkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setIsOpen(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Akun Saya
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Penghapusan Akun
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-red-600 font-medium">
                Peringatan: Tindakan ini tidak dapat dibatalkan!
              </p>
              <p>
                Semua data Anda akan dihapus secara permanen, termasuk:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Profil dan pengaturan</li>
                <li>Semua dompet dan saldo</li>
                <li>Semua transaksi</li>
                <li>Budget dan tujuan keuangan</li>
                <li>Data hutang/piutang</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="understand"
                  checked={confirmations.understand}
                  onCheckedChange={(checked: boolean) =>
                    setConfirmations((prev) => ({ ...prev, understand: checked }))
                  }
                />
                <Label htmlFor="understand" className="text-sm leading-tight cursor-pointer">
                  Saya memahami bahwa akun saya akan dihapus secara permanen
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="dataLoss"
                  checked={confirmations.dataLoss}
                  onCheckedChange={(checked: boolean) =>
                    setConfirmations((prev) => ({ ...prev, dataLoss: checked }))
                  }
                />
                <Label htmlFor="dataLoss" className="text-sm leading-tight cursor-pointer">
                  Saya memahami bahwa semua data akan hilang dan tidak dapat dipulihkan
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="noRecovery"
                  checked={confirmations.noRecovery}
                  onCheckedChange={(checked: boolean) =>
                    setConfirmations((prev) => ({ ...prev, noRecovery: checked }))
                  }
                />
                <Label htmlFor="noRecovery" className="text-sm leading-tight cursor-pointer">
                  Saya memahami bahwa tidak ada cara untuk memulihkan akun setelah dihapus
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-medium">
                Ketik <strong>&quot;hapus akun&quot;</strong> untuk konfirmasi:
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="hapus akun"
                className="border-red-200 focus-visible:ring-red-500"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Hapus Permanen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
