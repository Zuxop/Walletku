'use client';

import { useState, useEffect } from 'react';
import { Lock, X, Delete, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { isBiometricSupported, authenticateWithBiometric } from '@/lib/utils/biometric';

interface PINLockProps {
  onUnlock: () => void;
  onForgotPIN?: () => void;
}

export function PINLock({ onUnlock, onForgotPIN }: PINLockProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const supported = await isBiometricSupported();
    setBiometricSupported(supported);
  };

  const handleNumberPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      // Auto-verify when 6 digits entered
      if (newPin.length === 6) {
        verifyPIN(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const verifyPIN = async (pinToVerify: string) => {
    setLoading(true);
    try {
      // Get stored PIN hash from localStorage
      const storedHash = localStorage.getItem('app_pin_hash');
      
      if (!storedHash) {
        toast.error('PIN belum diatur');
        setLoading(false);
        return;
      }

      // Simple hash comparison (in production, use proper crypto)
      const inputHash = await hashPIN(pinToVerify);
      
      if (inputHash === storedHash) {
        toast.success('PIN benar');
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setPin('');
        setTimeout(() => setShake(false), 500);
        toast.error('PIN salah');
      }
    } catch (error) {
      toast.error('Verifikasi gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        toast.success('Autentikasi biometric berhasil');
        onUnlock();
      } else {
        toast.error('Autentikasi biometric gagal');
      }
    } catch (error) {
      toast.error('Biometric tidak tersedia');
    }
  };

  // Simple hash function (use proper crypto library in production)
  async function hashPIN(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900 mb-4">
          <Lock className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Masukkan PIN
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Aplikasi terkunci untuk keamanan
        </p>
      </div>

      {/* PIN Dots */}
      <div className={`flex gap-3 mb-8 ${shake ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i < pin.length
                ? error
                  ? 'bg-red-500'
                  : 'bg-indigo-600'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mb-4">PIN salah. Coba lagi.</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 max-w-xs w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberPress(num.toString())}
            disabled={loading}
            className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                     text-xl font-semibold text-gray-900 dark:text-white transition-colors
                     active:scale-95 disabled:opacity-50"
          >
            {num}
          </button>
        ))}
        
        {/* Bottom row */}
        <button
          onClick={handleBiometricAuth}
          disabled={loading || !biometricSupported}
          className="aspect-square rounded-xl bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 
                   flex items-center justify-center transition-colors
                   disabled:opacity-30"
        >
          <Fingerprint className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </button>
        
        <button
          onClick={() => handleNumberPress('0')}
          disabled={loading}
          className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                   text-xl font-semibold text-gray-900 dark:text-white transition-colors
                   active:scale-95 disabled:opacity-50"
        >
          0
        </button>
        
        <button
          onClick={handleDelete}
          disabled={loading || pin.length === 0}
          className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                   flex items-center justify-center transition-colors
                   disabled:opacity-30"
        >
          {pin.length === 0 ? (
            <X className="h-6 w-6 text-gray-400" />
          ) : (
            <Delete className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="mt-8 space-y-3">
        <button
          onClick={handleClear}
          disabled={pin.length === 0 || loading}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30"
        >
          Hapus semua
        </button>
        
        {onForgotPIN && (
          <div>
            <button
              onClick={onForgotPIN}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Lupa PIN?
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// PIN Setup Component
interface PINSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function PINSetup({ onComplete, onCancel }: PINSetupProps) {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNumberPress = (num: string, isConfirm: boolean) => {
    if (isConfirm) {
      if (confirmPin.length < 6) {
        setConfirmPin(confirmPin + num);
      }
    } else {
      if (pin.length < 6) {
        setPin(pin + num);
      }
    }
    setError('');
  };

  const handleDelete = (isConfirm: boolean) => {
    if (isConfirm) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
    setError('');
  };

  const handleNext = () => {
    if (pin.length !== 6) {
      setError('PIN harus 6 digit');
      return;
    }
    setStep('confirm');
  };

  const handleSave = async () => {
    if (confirmPin.length !== 6) {
      setError('PIN harus 6 digit');
      return;
    }

    if (pin !== confirmPin) {
      setError('PIN tidak cocok');
      setConfirmPin('');
      return;
    }

    setLoading(true);
    try {
      // Hash and save PIN
      const hash = await hashPIN(confirmPin);
      localStorage.setItem('app_pin_hash', hash);
      localStorage.setItem('pin_enabled', 'true');
      
      toast.success('PIN berhasil diatur');
      onComplete();
    } catch (error) {
      toast.error('Gagal menyimpan PIN');
    } finally {
      setLoading(false);
    }
  };

  const hashPIN = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const currentPin = step === 'create' ? pin : confirmPin;
  const setCurrentPin = (val: string) => {
    if (step === 'create') {
      setPin(val);
    } else {
      setConfirmPin(val);
    }
  };

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">
          {step === 'create' ? 'Buat PIN Baru' : 'Konfirmasi PIN'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {step === 'create' 
            ? 'Masukkan 6 digit PIN' 
            : 'Masukkan ulang PIN Anda'}
        </p>
      </div>

      {/* PIN Dots */}
      <div className="flex gap-3 justify-center mb-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < currentPin.length
                ? 'bg-indigo-600'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center mb-4">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberPress(num.toString(), step === 'confirm')}
            className="aspect-square rounded-xl bg-gray-100 hover:bg-gray-200 
                     text-lg font-semibold transition-colors active:scale-95"
          >
            {num}
          </button>
        ))}
        
        <button
          onClick={onCancel}
          className="aspect-square rounded-xl text-gray-500 hover:bg-gray-100 
                   flex items-center justify-center text-sm"
        >
          Batal
        </button>
        
        <button
          onClick={() => handleNumberPress('0', step === 'confirm')}
          className="aspect-square rounded-xl bg-gray-100 hover:bg-gray-200 
                   text-lg font-semibold transition-colors active:scale-95"
        >
          0
        </button>
        
        <button
          onClick={() => handleDelete(step === 'confirm')}
          disabled={currentPin.length === 0}
          className="aspect-square rounded-xl text-gray-500 hover:bg-gray-100 
                   flex items-center justify-center disabled:opacity-30"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>

      {/* Action Button */}
      <div className="mt-6 text-center">
        {step === 'create' ? (
          <Button
            onClick={handleNext}
            disabled={pin.length !== 6}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Lanjutkan
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={confirmPin.length !== 6 || loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? 'Menyimpan...' : 'Simpan PIN'}
          </Button>
        )}
      </div>
    </div>
  );
}
