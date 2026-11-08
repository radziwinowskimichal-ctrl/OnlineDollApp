"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { CalendarDays, LayoutDashboard, Truck, Users, Archive, Database } from 'lucide-react';
import { useApp } from '@/lib/context';
import { translations } from '@/lib/translations';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange }) => {
  const { language } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;

  const navItems = [
    { id: 'calendar', label: t.calendar || 'Kalendarz', icon: CalendarDays, isStar: true },
    { id: 'daily', label: t.dashboard || 'Operacje', icon: LayoutDashboard },
    { id: 'trailers', label: t.trailersHub || 'Flota', icon: Truck },
    { id: 'clients', label: t.clientsCrm || 'Klienci', icon: Users },
    { id: 'archive', label: t.archive || 'Archiwum', icon: Archive },
    { id: 'backup', label: 'Backup', icon: Database },
  ];

  const handleSelect = (id: string) => {
    // Provide subtle haptic feedback if browser supports navigator.vibrate
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch (e) {
        // ignore
      }
    }
    onTabChange(id);
  };

  return (
    <nav 
      aria-label="Nawigacja mobilna"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-1.5 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[46px] min-h-[48px] py-1 px-1.5 rounded-xl transition-all duration-200 active:scale-95",
                isActive 
                  ? "text-primary font-bold" 
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
              {/* Star / highlighted badge for calendar */}
              {item.isStar && (
                <span className={cn(
                  "absolute -top-1 px-1.5 py-0.2 rounded-full text-[9px] font-black tracking-widest uppercase shadow-xs transition-transform",
                  isActive 
                    ? "bg-primary text-primary-foreground scale-100" 
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 scale-90"
                )}>
                  ★
                </span>
              )}

              <div className={cn(
                "relative p-1.5 rounded-xl transition-all duration-200",
                isActive ? "bg-primary/15 text-primary scale-110" : "hover:bg-muted/60"
              )}>
                <Icon className={cn("w-5 h-5", item.isStar && isActive && "stroke-[2.5]")} />
              </div>

              <span className="text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-[64px]">
                {item.label}
              </span>

              {/* Active dot indicator */}
              {isActive && (
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-0.5 animate-in fade-in zoom-in-50 duration-200" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
