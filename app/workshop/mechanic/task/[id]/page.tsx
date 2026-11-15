"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LoginScreen } from "@/components/LoginScreen";
import { WorkshopModule } from "@/components/workshop/WorkshopModule";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/context";
import { translations } from "@/lib/translations";
import { getWorkshopI18n } from "@/lib/workshop-i18n";
import { cn } from "@/lib/utils";

export default function MechanicTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    currentUserId,
    currentUser,
    isMechanic,
    logoutUser,
    isHydrated,
    language,
    setLanguage,
  } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;
  const w = getWorkshopI18n(language);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!currentUserId) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 sm:h-16 border-b bg-card shrink-0 flex items-center justify-between px-3 sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          {!isMechanic && (
            <Link
              href="/?tab=workshop"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{w.backToOrdersList}</span>
            </Link>
          )}
          <Logo textSize="sm" iconSize={18} className="scale-90 sm:scale-100" />
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {t.mechanicPortal} · {w.gdprShort}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pr-10">
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg border bg-muted/40">
            {(["pl", "de", "en"] as const).map((langCode) => (
              <button
                key={langCode}
                type="button"
                onClick={() => setLanguage(langCode)}
                className={cn(
                  "px-1.5 sm:px-2 py-1 rounded text-[10px] font-black uppercase transition-colors",
                  language === langCode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {langCode}
              </button>
            ))}
          </div>

          {currentUser && (
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {currentUser.name}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logoutUser}
            className="text-slate-500 font-bold uppercase tracking-tighter hover:text-primary h-8 sm:h-9 px-2.5 sm:px-4 border text-xs"
          >
            <LogOut className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{t.logout}</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto bg-card border rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm min-h-[520px]">
          <WorkshopModule initialOrderId={id} />
        </div>
      </main>
    </div>
  );
}
