"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { CalendarDays, LayoutDashboard, Truck, Users, Archive, Database, Wrench } from 'lucide-react';
import { useApp } from '@/lib/context';
import { translations } from '@/lib/translations';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange }) => {
  const { language, isMechanic, unreadWorkshopNotificationsCount } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;

  if (isMechanic) return null;

  const navItems = [
    { id: 'calendar', label: t.calendar || 'Kalendarz', icon: CalendarDays, isStar: true },
    { id: 'workshop', label: t.workshop || 'Warsztat', icon: Wrench, badge: unreadWorkshopNotificationsCount },
    { id: 'daily', label: t.dashboard || 'Operacje', icon: LayoutDashboard },
    { id: 'trailers', label: t.trailersHub || 'Flota', icon: Truck },
    { id: 'clients', label: t.clientsCrm || 'Klienci', icon: Users },
    { id: 'archive', label: t.archive || 'Archiwum', icon: Archive },
    { id: 'backup', label: 'Backup', icon: Database },
  ];

  const handleSelect = (id: string) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // ignore
      }
    }
    onTabChange(id);
  };

  return (
    <nav 
      aria-label="Nawigacja mobilna"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[44px] min-h-[48px] py-1 px-1 rounded-xl transition-all duration-200 active:scale-95",
                isActive 
                  ? "text-primary font-bold" 
                  : "text-muted-foreground hover:text-foreground font-medium"
              )}
            >
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
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center tabular-nums">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[9px] tracking-tight leading-tight mt-0.5 truncate max-w-[54px]">
                {item.label}
              </span>

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
