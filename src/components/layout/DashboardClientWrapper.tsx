'use client';

import { User } from '@supabase/supabase-js';
import { Profile } from '@/types/database';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { PINLockProvider } from './PINLockProvider';

interface DashboardClientWrapperProps {
  children: React.ReactNode;
  user: User;
  profile: Profile | null;
}

export function DashboardClientWrapper({ children, user, profile }: DashboardClientWrapperProps) {
  return (
    <PINLockProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar user={user} profile={profile} />
        </div>

        {/* Mobile Topbar */}
        <div className="lg:hidden">
          <Topbar user={user} profile={profile} />
        </div>

        {/* Main Content */}
        <main className="lg:pl-64">
          <div className="max-w-7xl mx-auto p-4 lg:p-8 pb-24 lg:pb-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </PINLockProvider>
  );
}
