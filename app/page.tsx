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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, CalendarDays, Users, Clock, Archive, LogOut, User, LayoutDashboard, BarChart3, Settings as SettingsIcon, Cloud, Database } from "lucide-react";
import { useApp } from "@/lib/context";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";

import { PWAInstallButton } from "@/components/PWAInstallButton";
import { MobileBottomNav } from "@/components/MobileBottomNav";

function HomeContent() {
  const searchParams = useSearchParams();
  const { language, currentUserId, profiles, logoutUser, isHydrated, isCloudConnected, cloudSyncStatus, backups } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "calendar");

  const me = profiles.find(p => p.id === currentUserId);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setTimeout(() => {
        setActiveTab(tabFromUrl);
      }, 0);
    }
  }, [tabFromUrl, activeTab]);

  // Update URL so back navigation from /trailers/:id acts logically
  const handleTabChange = (tabId: string) => {
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

  const menuItems = [
    { id: "daily", label: t.dashboard, icon: LayoutDashboard },
    { id: "trailers", label: t.trailersHub, icon: Truck },
    { id: "calendar", label: t.calendar, icon: CalendarDays },
    { id: "clients", label: t.clientsCrm, icon: Users },
    { id: "archive", label: t.archive, icon: Archive },
    { id: "backup", label: "Backup", icon: Database },
    { id: "reports", label: t.reports || "Raporty", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen relative pb-16 md:pb-0">
      {/* Desktop Sidebar (Hidden on mobile phones / Android) */}
      <aside className="w-24 hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r shrink-0">
        <div className="flex flex-col items-center py-6 gap-6 grow">
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
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>
        <div className="pb-8 flex flex-col items-center gap-4">
           <button 
              onClick={() => handleTabChange("backup")}
              title="Backup & Baza danych"
              className="p-2 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
           >
              <SettingsIcon className="w-5 h-5" />
           </button>
        </div>
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
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Install PWA Button (Android / Chrome / iOS) */}
            <PWAInstallButton compact />

            {me && (
              <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 bg-muted/50 py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-full border border-slate-200">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-primary" />
                </div>
                <span className="truncate max-w-[100px] md:max-w-none">{me.name}</span>
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
            {activeTab !== 'calendar' && activeTab !== 'backup' && (
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
                <TabsContent value="calendar" className="mt-0">
                  <div className="bg-card border rounded-2xl p-2 sm:p-4 md:p-8 shadow-xl shadow-slate-200/50 min-h-[calc(100vh-8.5rem)] flex flex-col">
                    <TrailerCalendar />
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
