'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Language } from '@/lib/translations';

export function LanguageSelector() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);
  const [currentLang, setCurrentLang] = useState<Language>(
    (profile?.bahasa as Language) || 'id'
  );
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile?.bahasa) {
      setCurrentLang(profile.bahasa as Language);
    }
  }, [profile?.bahasa]);

  const handleLanguageChange = async (lang: Language) => {
    if (!user) {
      // Just update local state if not logged in
      setCurrentLang(lang);
      localStorage.setItem('app_language', lang);
      toast.success(`Bahasa diubah ke ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}`);
      return;
    }

    setIsUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ bahasa: lang })
        .eq('id', user.id);

      if (error) throw error;

      setCurrentLang(lang);
      localStorage.setItem('app_language', lang);
      
      // Update local profile
      if (profile) {
        setProfile({ ...profile, bahasa: lang });
      }

      toast.success(`Bahasa diubah ke ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}`);
      window.location.reload(); // Reload to apply translations
    } catch (error) {
      console.error('Error updating language:', error);
      toast.error('Gagal mengubah bahasa');
    } finally {
      setIsUpdating(false);
    }
  };

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Bahasa / Language
        </CardTitle>
        <CardDescription>
          Pilih bahasa yang Anda inginkan / Choose your preferred language
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant={currentLang === lang.code ? 'default' : 'outline'}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isUpdating}
              className="justify-start gap-3 h-auto py-4"
            >
              <span className="text-2xl">{lang.flag}</span>
              <div className="flex-1 text-left">
                <p className="font-medium">{lang.name}</p>
                <p className="text-xs text-muted-foreground">
                  {lang.code === 'id' ? 'Indonesian' : 'English'}
                </p>
              </div>
              {currentLang === lang.code && (
                <Check className="h-5 w-5 text-primary-foreground" />
              )}
            </Button>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          * Mengubah bahasa akan me-reload halaman untuk menerapkan semua perubahan.
        </p>
      </CardContent>
    </Card>
  );
}
