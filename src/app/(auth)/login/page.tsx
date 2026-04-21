'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { OTPLoginForm } from '@/components/auth/OTPLoginForm';
import { BiometricLoginButton } from '@/components/auth/BiometricLoginButton';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Selamat Datang</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Masuk ke Aturla Wallet untuk mengelola keuanganmu</p>
      </div>

      {loginMethod === 'password' ? (
        <>
          <LoginForm />
          
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLoginMethod('otp')}
            >
              Login dengan OTP / Magic Link
            </Button>
          </div>

          <div className="mt-4">
            <BiometricLoginButton 
              onSuccess={() => router.push('/')} 
            />
          </div>
        </>
      ) : (
        <OTPLoginForm
          onSuccess={() => router.push('/')}
          onBack={() => setLoginMethod('password')}
        />
      )}

      <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
        Belum punya akun?{' '}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
