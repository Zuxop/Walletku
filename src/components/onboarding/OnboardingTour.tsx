'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Wallet, 
  Receipt, 
  PieChart, 
  Target, 
  Shield,
  Sparkles
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Selamat Datang di Aturla Wallet!',
    description: 'Aplikasi manajemen keuangan pribadi Anda. Mari kita mulai dengan mengenal fitur-fitur utama.',
    icon: <Sparkles className="h-8 w-8 text-yellow-500" />,
    tips: [
      'Catat pemasukan dan pengeluaran harian',
      'Atur budget bulanan dengan mudah',
      'Pantau tujuan keuangan Anda',
    ],
  },
  {
    id: 'wallets',
    title: 'Kelola Dompet Anda',
    description: 'Buat multiple dompet untuk berbagai keperluan - tunai, bank, e-wallet, atau investasi.',
    icon: <Wallet className="h-8 w-8 text-blue-500" />,
    tips: [
      'Tambahkan dompet dari menu Dompet',
      'Setiap dompet memiliki saldo terpisah',
      'Pindahkan uang antar dompet dengan fitur transfer',
    ],
  },
  {
    id: 'transactions',
    title: 'Catat Transaksi',
    description: 'Setiap transaksi tercatat rapi dengan kategori, tanggal, dan catatan lengkap.',
    icon: <Receipt className="h-8 w-8 text-green-500" />,
    tips: [
      'Gunakan tombol + untuk transaksi cepat',
      'Tambahkan foto struk/bukti transaksi',
      'Filter berdasarkan tanggal dan kategori',
    ],
  },
  {
    id: 'budget',
    title: 'Atur Budget Bulanan',
    description: 'Tetapkan budget untuk setiap kategori pengeluaran dan pantau penggunaannya.',
    icon: <PieChart className="h-8 w-8 text-purple-500" />,
    tips: [
      'Buat budget per kategori pengeluaran',
      'Dapatkan notifikasi saat mendekati batas',
      'Lihat progress budget secara real-time',
    ],
  },
  {
    id: 'goals',
    title: 'Capai Tujuan Keuangan',
    description: 'Tetapkan target tabungan dan pantau progressnya setiap bulan.',
    icon: <Target className="h-8 w-8 text-orange-500" />,
    tips: [
      'Buat tujuan seperti dana darurat atau liburan',
      'Tetapkan deadline untuk motivasi',
      'Lihat estimasi waktu tercapai',
    ],
  },
  {
    id: 'security',
    title: 'Keamanan Data',
    description: 'Data Anda aman dengan enkripsi dan fitur keamanan tambahan.',
    icon: <Shield className="h-8 w-8 text-red-500" />,
    tips: [
      'Aktifkan PIN lock untuk proteksi tambahan',
      'Gunakan biometric login (fingerprint/face ID)',
      'Ekspor data untuk backup berkala',
    ],
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('onboarding_completed');
    if (completed === 'true') {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsVisible(false);
    onSkip?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 supports-backdrop-filter:backdrop-blur-sm">
      <Card className="w-full max-w-lg animate-in fade-in zoom-in duration-300">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              {step.icon}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Langkah {currentStep + 1} dari {steps.length}
              </p>
              <CardTitle className="text-xl mt-1">{step.title}</CardTitle>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <Progress value={progress} className="h-2" />

          <p className="text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="font-medium text-sm">💡 Tips:</p>
            <ul className="space-y-1.5">
              {step.tips.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>

            <div className="flex gap-2">
              {currentStep === steps.length - 1 ? (
                <Button onClick={handleComplete} className="gap-1 bg-green-600 hover:bg-green-700">
                  <Sparkles className="h-4 w-4" />
                  Mulai Menggunakan
                </Button>
              ) : (
                <Button onClick={handleNext} className="gap-1">
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="w-full text-muted-foreground"
          >
            Lewati tutorial
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Reset function for testing
export function resetOnboarding() {
  localStorage.removeItem('onboarding_completed');
  window.location.reload();
}
