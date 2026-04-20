import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Buat Akun Baru</h1>
        <p className="text-gray-500 mt-2">Daftar gratis untuk mulai mengelola keuanganmu</p>
      </div>

      <RegisterForm />

      <p className="text-center mt-6 text-sm text-gray-600">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Masuk
        </Link>
      </p>
    </div>
  );
}
