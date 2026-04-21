'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

interface OTPLoginFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function OTPLoginForm({ onSuccess, onBack }: OTPLoginFormProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const supabase = createClient();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Masukkan email yang valid');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Only allow existing users
        },
      });

      if (error) {
        if (error.message.includes('User not found')) {
          toast.error('Email tidak terdaftar. Silakan daftar terlebih dahulu.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Kode OTP telah dikirim ke email Anda');
      setStep('otp');
      setCountdown(60);
      
      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast.error('Gagal mengirim OTP. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Masukkan kode OTP 6 digit');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        toast.error('Kode OTP salah atau sudah expired');
        return;
      }

      toast.success('Login berhasil!');
      
      // Store email for biometric login
      localStorage.setItem('last_login_email', email);
      
      onSuccess();
    } catch (error) {
      toast.error('Verifikasi gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Kode OTP baru telah dikirim');
      setCountdown(60);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast.error('Gagal mengirim OTP');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <form onSubmit={handleSendOTP} className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali
        </Button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-3">
            <Mail className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold">Login dengan OTP</h3>
          <p className="text-sm text-gray-500">
            Masukkan email Anda untuk menerima kode verifikasi
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp-email">Email</Label>
          <Input
            id="otp-email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengirim...
            </>
          ) : (
            'Kirim Kode OTP'
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setStep('email')}
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Kembali
      </Button>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-3">
          <Mail className="h-6 w-6 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold">Verifikasi OTP</h3>
        <p className="text-sm text-gray-500">
          Masukkan kode 6 digit yang dikirim ke{' '}
          <span className="font-medium">{email}</span>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp-code">Kode OTP</Label>
        <Input
          id="otp-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          required
          className="text-center text-2xl tracking-widest"
          autoFocus
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={loading || otp.length !== 6}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memverifikasi...
          </>
        ) : (
          'Verifikasi'
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={countdown > 0 || loading}
          className="text-sm text-indigo-600 hover:text-indigo-700 disabled:text-gray-400"
        >
          {countdown > 0
            ? `Kirim ulang dalam ${countdown} detik`
            : 'Kirim ulang kode'}
        </button>
      </div>
    </form>
  );
}
