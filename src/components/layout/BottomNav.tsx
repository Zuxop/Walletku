'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Home, ArrowLeftRight, Wallet, BarChart3, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { TransaksiForm } from '@/components/transaksi/TransaksiForm';

const navItems = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/transaksi', label: 'Transaksi', icon: ArrowLeftRight },
  { href: '/dompet', label: 'Dompet', icon: Wallet },
  { href: '/laporan', label: 'Laporan', icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <nav className="flex items-center justify-around h-16">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1',
                isActive ? 'text-indigo-600' : 'text-gray-500'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* FAB - Floating Action Button */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger>
            <div className="relative -top-4 flex flex-col items-center cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow">
                <Plus className="h-6 w-6 text-white" />
              </div>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader>
              <SheetTitle>Tambah Transaksi</SheetTitle>
            </SheetHeader>
            <div className="py-6">
              <TransaksiForm onSuccess={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1',
                isActive ? 'text-indigo-600' : 'text-gray-500'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
