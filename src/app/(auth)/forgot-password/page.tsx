'use client';

import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Lupa Password?</h1>
        <p className="text-gray-500 mt-2">Jangan khawatir, kami akan membantu Anda mereset password</p>
      </div>

      <ForgotPasswordForm onBack={() => router.push('/login')} />
    </div>
  );
}
