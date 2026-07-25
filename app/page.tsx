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
import { LoginScreen } from "@/components/LoginScreen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, CalendarDays, Users, Clock, Archive, LogOut, User, LayoutDashboard, BarChart3, Settings as SettingsIcon } from "lucide-react";
import { useApp } from "@/lib/context";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";

function HomeContent() {
  const searchParams = useSearchParams();
  const { language, currentUserId, profiles, logoutUser } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "calendar");

  const me = profiles.find(p => p.id === currentUserId);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Update URL so back navigation from /trailers/:id acts logically
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.history.replaceState(null, "", `/?tab=${tabId}`);
  };

  if (!currentUserId) {
    return <LoginScreen />;
  }

  const menuItems = [
    { id: "daily", label: t.dashboard, icon: LayoutDashboard },
    { id: "trailers", label: t.trailersHub, icon: Truck },
    { id: "calendar", label: t.calendar, icon: CalendarDays },
    { id: "clients", label: t.clientsCrm, icon: Users },
    { id: "archive", label: t.archive, icon: Archive },
    { id: "reports", label: t.reports || "Raporty", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-24 flex flex-col bg-sidebar text-sidebar-foreground border-r shrink-0">
        <div className="flex flex-col items-center py-8 gap-8 grow">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 group w-full px-2 transition-all",
                activeTab === item.id 
                  ? "text-sidebar-primary border-r-4 border-sidebar-primary" 
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-colors",
                activeTab === item.id ? "bg-sidebar-primary/10" : "group-hover:bg-sidebar-accent"
              )}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>
        <div className="pb-8 flex flex-col items-center gap-4">
           <button className="p-2 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors">
              <SettingsIcon className="w-5 h-5" />
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 border-b bg-card grow-0 shrink-0 flex items-center justify-between px-8">
          <Logo textSize="md" iconSize={20} />
          <div className="flex items-center gap-6">
            {me && (
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 bg-muted/50 py-1.5 px-3 rounded-full border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <span>Użytkownik: <span className="text-slate-900">{me.name}</span></span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={logoutUser} className="text-slate-500 font-bold uppercase tracking-tighter hover:text-primary transition-colors h-9 px-4 border">
              <LogOut className="w-4 h-4 mr-2" />
              {t.logout || "Wyloguj"}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto space-y-8">
            {/* Unified Dashboard / Stats at top */}
            {activeTab !== 'calendar' && (
              <section className="animate-in fade-in duration-700">
                <Dashboard onActionClick={(action) => handleTabChange(action)} />
              </section>
            )}

            {/* View Switcher (Horizontal tabs for secondary nav) */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <TabsContent value="daily" className="mt-0">
                  <div className="bg-card border rounded-2xl p-8 shadow-xl shadow-slate-200/50 min-h-[500px]">
                    <DailyOperations />
                  </div>
                </TabsContent>
                <TabsContent value="trailers" className="mt-0">
                  <div className="bg-card border rounded-2xl p-8 shadow-xl shadow-slate-200/50 min-h-[500px]">
                    <TrailerHub />
                  </div>
                </TabsContent>
                <TabsContent value="calendar" className="mt-0">
                  <div className="bg-card border rounded-2xl p-4 md:p-8 shadow-xl shadow-slate-200/50 h-[calc(100vh-10rem)] flex flex-col">
                    <TrailerCalendar />
                  </div>
                </TabsContent>
                <TabsContent value="clients" className="mt-0">
                  <div className="bg-card border rounded-2xl p-8 shadow-xl shadow-slate-200/50 min-h-[500px]">
                    <ClientList />
                  </div>
                </TabsContent>
                <TabsContent value="archive" className="mt-0">
                  <div className="bg-card border rounded-2xl p-8 shadow-xl shadow-slate-200/50 min-h-[500px]">
                    <ArchiveComponent />
                  </div>
                </TabsContent>
                <TabsContent value="reports" className="mt-0">
                  <div className="bg-card border rounded-2xl p-12 shadow-xl shadow-slate-200/50 min-h-[500px] flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-800">Moduł Raportów</h3>
                      <p className="text-muted-foreground">Analiza przychodów i obłożenia dostępna wkrótce.</p>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Ładowanie...</div>}>
      <HomeContent />
    </Suspense>
  );
}
