"use client";

import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useApp } from '@/lib/context';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const { language } = useApp();
  const [showGuide, setShowGuide] = useState(false);

  // If already installed and running as standalone app, hide button
  if (isInstalled) {
    return null;
  }

  const t = {
    pl: {
      installApp: 'Zainstaluj na telefonie',
      installShort: 'Zainstaluj',
      androidBadge: 'Android APK / PWA',
      guideTitle: 'Instalacja na smartfonie',
      androidGuide1: '1. Kliknij menu Chrome (3 kropki w prawym górnym rogu).',
      androidGuide2: '2. Wybierz opcję "Zainstaluj aplikację" lub "Dodaj do ekranu głównego".',
      iosGuide1: '1. Dotknij przycisku Udostępnij (ikona ze strzałką w górę w Safari).',
      iosGuide2: '2. Przewiń w dół i wybierz "Do ekranu początkowego".',
      close: 'Rozumiem',
    },
    de: {
      installApp: 'Auf Smartphone installieren',
      installShort: 'Installieren',
      androidBadge: 'Android APK / PWA',
      guideTitle: 'Installation auf dem Smartphone',
      androidGuide1: '1. Tippen Sie auf das Chrome-Menü (3 Punkte oben rechts).',
      androidGuide2: '2. Wählen Sie "App installieren" oder "Zum Startbildschirm hinzufügen".',
      iosGuide1: '1. Tippen Sie in Safari auf die Teilen-Schaltfläche.',
      iosGuide2: '2. Wählen Sie "Zum Home-Bildschirm".',
      close: 'Verstanden',
    },
    en: {
      installApp: 'Install on Phone',
      installShort: 'Install',
      androidBadge: 'Android APK / PWA',
      guideTitle: 'Install on Smartphone',
      androidGuide1: '1. Tap Chrome menu (3 dots at top-right).',
      androidGuide2: '2. Choose "Install app" or "Add to Home screen".',
      iosGuide1: '1. Tap the Share button in Safari toolbar.',
      iosGuide2: '2. Scroll down and choose "Add to Home Screen".',
      close: 'Got it',
    },
  }[language as 'pl' | 'de' | 'en'] || {
    installApp: 'Zainstaluj na telefonie',
    installShort: 'Zainstaluj',
    androidBadge: 'Android APK / PWA',
    guideTitle: 'Instalacja na smartfonie',
    androidGuide1: '1. Kliknij menu Chrome (3 kropki).',
    androidGuide2: '2. Wybierz "Zainstaluj aplikację".',
    iosGuide1: '1. Dotknij przycisku Udostępnij.',
    iosGuide2: '2. Wybierz "Do ekranu początkowego".',
    close: 'Rozumiem',
  };

  // Chromium / Android 1-click install prompt flow
  if (isInstallable) {
    return (
      <Button
        onClick={install}
        size={compact ? "sm" : "default"}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition-all active:scale-95 text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3"
      >
        <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100" />
        <span>{compact ? t.installShort : t.installApp}</span>
      </Button>
    );
  }

  // Mobile device fallback button (instructions guide modal)
  return (
    <>
      <Button
        onClick={() => setShowGuide(true)}
        variant="outline"
        size={compact ? "sm" : "default"}
        className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 font-medium text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
      >
        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-blue-600" />
        <span className="hidden xs:inline">{compact ? t.installShort : t.installApp}</span>
        <span className="xs:hidden">{t.installShort}</span>
      </Button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-card border p-6 shadow-2xl relative text-card-foreground">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">{t.guideTitle}</h3>
                <span className="text-xs text-muted-foreground">{t.androidBadge}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground bg-muted/40 p-4 rounded-xl border">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p>{isIOS ? t.iosGuide1 : t.androidGuide1}</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p>{isIOS ? t.iosGuide2 : t.androidGuide2}</p>
              </div>
            </div>

            <Button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full font-bold"
            >
              {t.close}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
