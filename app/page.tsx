"use client";

import { useState, useEffect, Suspense } from "react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Dashboard } from "@/components/Dashboard";
import { TrailerCalendar } from "@/components/TrailerCalendar";
import { ClientList } from "@/components/ClientList";
import { TrailerHub } from "@/components/TrailerHub";
import { DailyOperations } from "@/components/DailyOperations";
import { Archive as ArchiveComponent } from "@/components/Archive";
import { BackupManager } from "@/components/BackupManager";
import { LoginScreen } from "@/components/LoginScreen";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Truck, CalendarDays, Users, Archive, LogOut, User, LayoutDashboard, BarChart3, Settings as SettingsIcon, Cloud, Database, ShieldCheck, Lock, Wrench, ShieldAlert } from "lucide-react";
import { useApp } from "@/lib/context";
import { translations } from "@/lib/translations";
import { getWorkshopI18n } from "@/lib/workshop-i18n";
import { Button } from "@/components/ui/button";

import { PWAInstallButton } from "@/components/PWAInstallButton";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { WorkshopModule } from "@/components/workshop/WorkshopModule";
import { TuvManager } from "@/components/TuvManager";

function HomeContent() {
  const searchParams = useSearchParams();
  const {
    language,
    setLanguage,
    currentUserId,
    currentUser,
    isAdmin,
    isOffice,
    isMechanic,
    canManage,
    logoutUser,
    isHydrated,
    backups,
    unreadWorkshopNotificationsCount,
  } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;
  const w = getWorkshopI18n(language);
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "calendar");

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      if (tabFromUrl === "reports" && !canManage("settings.edit")) {
        setTimeout(() => setActiveTab("calendar"), 0);
        return;
      }
      if (tabFromUrl === "tuv" && isMechanic) {
        setTimeout(() => setActiveTab("calendar"), 0);
        return;
      }
      setTimeout(() => {
        setActiveTab(tabFromUrl);
      }, 0);
    }
  }, [tabFromUrl, activeTab, isOffice, isMechanic, canManage]);

  // Update URL so back navigation from /trailers/:id acts logically
  const handleTabChange = (tabId: string) => {
    if (tabId === "reports" && !canManage("settings.edit")) return;
    if (tabId === "tuv" && isMechanic) return;
    setActiveTab(tabId);
    window.history.replaceState(null, "", `/?tab=${tabId}`);
  };

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

  // Dedicated RODO-Isolated Portal for Mechanics (No access to Clients CRM, Rental Calendar, Archive, or Backups)
  if (isMechanic) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="h-14 sm:h-16 border-b bg-card shrink-0 flex items-center justify-between px-3 sm:px-6 md:px-8">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <Logo textSize="sm" iconSize={18} className="scale-90 sm:scale-100" />
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 px-2.5 py-1 rounded-md text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {t.mechanicPortal} · {w.gdprShort}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 pr-10">
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
            <PWAInstallButton compact />
            {currentUser && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-lg border bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200">
                <span className="truncate max-w-[90px] sm:max-w-[140px]">{currentUser.name}</span>
                <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-200/70 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                  {t.roleMechanic}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={logoutUser}
              className="text-slate-500 font-bold uppercase tracking-tighter hover:text-primary transition-colors h-8 sm:h-9 px-2.5 sm:px-4 border text-xs"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.logout || "Wyloguj"}</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            <div className="bg-card border rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm min-h-[500px]">
              <WorkshopModule />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const allMenuItems = [
    { id: "daily", label: t.dashboard, icon: LayoutDashboard, adminOnly: false },
    { id: "trailers", label: t.trailersHub, icon: Truck, adminOnly: false },
    { id: "tuv", label: t.tuvNavLabel, icon: ShieldAlert, adminOnly: false },
    { id: "calendar", label: t.calendar, icon: CalendarDays, adminOnly: false },
    { id: "workshop", label: t.workshop || "Warsztat", icon: Wrench, adminOnly: false },
    { id: "clients", label: t.clientsCrm, icon: Users, adminOnly: false },
    { id: "archive", label: t.archive, icon: Archive, adminOnly: false },
    { id: "backup", label: "Backup", icon: Database, adminOnly: false },
    { id: "reports", label: t.reports || "Raporty", icon: BarChart3, adminOnly: false },
  ];

  const menuItems = allMenuItems.filter((item) => !item.adminOnly || isOffice);

  return (
    <div className="flex min-h-screen relative pb-16 md:pb-0">
      {/* Desktop Sidebar (Hidden on mobile phones / Android) */}
      <aside className="w-24 hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r shrink-0">
        <div className="flex flex-col items-center py-6 gap-5 grow">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 group w-full px-2 transition-all relative",
                activeTab === item.id 
                  ? "text-sidebar-primary border-r-4 border-sidebar-primary" 
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-colors relative",
                activeTab === item.id ? "bg-sidebar-primary/10" : "group-hover:bg-sidebar-accent"
              )}>
                <item.icon className="w-6 h-6" />
                {item.id === "backup" && backups.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                    {backups.length}
                  </span>
                )}
                {item.id === "workshop" && unreadWorkshopNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadWorkshopNotificationsCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>
        {isAdmin && (
          <div className="pb-8 flex flex-col items-center gap-4">
            <button 
              onClick={() => handleTabChange("backup")}
              title="Backup & Baza danych"
              className="p-2 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-14 sm:h-16 border-b bg-card grow-0 shrink-0 flex items-center justify-between px-3 sm:px-6 md:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Logo textSize="sm" iconSize={18} className="scale-90 sm:scale-100" />
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-950 px-2.5 py-1 rounded-full text-[11px] font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.cloudSyncBadge}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5 pr-10">
            {/* Quick Language Switcher (PL / DE / EN) */}
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

            {/* Install PWA Button (Android / Chrome / iOS) */}
            <PWAInstallButton compact />

            {currentUser && (
              <div className={cn(
                "flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold py-1 sm:py-1.5 px-2 sm:px-3 rounded-full border",
                isAdmin
                  ? "bg-amber-50/90 border-amber-300 text-amber-950"
                  : "bg-muted/50 border-slate-200 text-slate-700"
              )}>
                <div className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center",
                  isAdmin ? "bg-amber-200/70 text-amber-800" : "bg-primary/10 text-primary"
                )}>
                  {isAdmin ? (
                    <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  ) : (
                    <User className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  )}
                </div>
                <span className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-none">{currentUser.name}</span>
                <span className={cn(
                  "hidden md:inline-flex text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                  isAdmin ? "bg-amber-200 text-amber-900" : "bg-slate-200 text-slate-700"
                )}>
                  {isAdmin ? t.roleAdmin : isOffice ? t.roleEmployee : t.roleMechanic}
                </span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={logoutUser} className="text-slate-500 font-bold uppercase tracking-tighter hover:text-primary transition-colors h-8 sm:h-9 px-2.5 sm:px-4 border text-xs">
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.logout || "Wyloguj"}</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 pb-20 md:pb-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6 md:space-y-8">
            {/* Unified Dashboard / Stats at top */}
            {activeTab !== 'calendar' && activeTab !== 'backup' && activeTab !== 'workshop' && activeTab !== 'tuv' && (
              <section className="animate-in fade-in duration-700">
                <Dashboard onActionClick={(action) => handleTabChange(action)} />
              </section>
            )}

            {/* View Switcher (Horizontal tabs for secondary nav) */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <TabsContent value="daily" className="mt-0">
                  <div className="bg-card border rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl shadow-slate-200/50 min-h-[450px]">
                    <DailyOperations />
                  </div>
                </TabsContent>
                <TabsContent value="trailers" className="mt-0">
                  <div className="bg-card border rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl shadow-slate-200/50 min-h-[450px]">
                    <TrailerHub />
                  </div>
                </TabsContent>
                <TabsContent value="tuv" className="mt-0">
                  <div className="bg-card border rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl shadow-slate-200/50 min-h-[450px]">
                    <TuvManager />
                  </div>
                </TabsContent>
                <TabsContent value="calendar" className="mt-0">
                  <div className="bg-card border rounded-2xl p-2 sm:p-4 md:p-8 shadow-xl shadow-slate-200/50 min-h-[calc(100vh-8.5rem)] flex flex-col">
                    <TrailerCalendar />
                  </div>
                </TabsContent>
                <TabsContent value="workshop" className="mt-0">
                  <div className="bg-card border rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl shadow-slate-200/50 min-h-[500px]">
                    <WorkshopModule />
                  </div>
                </TabsContent>
                <TabsContent value="clients" className="mt-0">
                  <div className="bg-card border rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl shadow-slate-200/50 min-h-[450px]">
                    <ClientList />
                  </div>
                </TabsContent>
                <TabsContent value="archive" className="mt-0">
                  <div className="bg-card border rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl shadow-slate-200/50 min-h-[450px]">
                    <ArchiveComponent />
                  </div>
                </TabsContent>
                <TabsContent value="backup" className="mt-0">
                  <div className="bg-card border rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl shadow-slate-200/50 min-h-[450px]">
                    <BackupManager />
                  </div>
                </TabsContent>
                <TabsContent value="reports" className="mt-0">
                  <div className="bg-card border rounded-2xl p-6 sm:p-12 shadow-xl shadow-slate-200/50 min-h-[450px] flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/20 mx-auto mb-4" />
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800">{t.reportsTitle}</h3>
                      <p className="text-sm text-muted-foreground">{t.reportsDesc}</p>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation (Android & Smartphone Ergonomics) */}
      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">...</div>}>
      <HomeContent />
    </Suspense>
  );
}
