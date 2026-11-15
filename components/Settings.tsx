"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Settings as SettingsIcon, Moon, Sun, Monitor, Check, ShieldCheck, User, UserPlus, Trash2, Lock, Wrench } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/context";
import { getProfileLogin } from "@/lib/store";
import { WORKSHOP_UNITS } from "@/lib/workshop-types";
import { availableColors, solidColorClassMap } from "@/lib/colors";
import { translations as globalTranslations } from "@/lib/translations";

export function Settings() {
  const { theme, setTheme } = useTheme();
  const {
    language,
    setLanguage,
    statusColors,
    updateStatusColor,
    currentUser,
    currentUserId,
    isAdmin,
    canManage,
    profiles,
    addEmployeeProfile,
    deleteEmployeeProfile,
  } = useApp();
  const [mounted, setMounted] = React.useState(false);
  const [newEmployeeName, setNewEmployeeName] = React.useState("");
  const [newRole, setNewRole] = React.useState<"employee" | "mechanic">("employee");
  const [newUnit, setNewUnit] = React.useState<string>(WORKSHOP_UNITS[0]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const translations = {
    pl: {
      settings: "Ustawienia",
      settingsDesc: "Zarządzaj preferencjami aplikacji.",
      theme: "Motyw",
      light: "Jasny",
      dark: "Ciemny",
      system: "Systemowy",
      language: "Język",
      polish: "Polski",
      english: "Angielski",
      german: "Niemiecki",
    },
    en: {
      settings: "Settings",
      settingsDesc: "Manage your application preferences.",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
      language: "Language",
      polish: "Polish",
      english: "English",
      german: "German",
    },
    de: {
      settings: "Einstellungen",
      settingsDesc: "Verwalten Sie Ihre Anwendungseinstellungen.",
      theme: "Thema",
      light: "Hell",
      dark: "Dunkel",
      system: "System",
      language: "Sprache",
      polish: "Polnisch",
      english: "Englisch",
      german: "Deutsch",
    }
  };

  const t = translations[language as keyof typeof translations] || translations.pl;
  const globalT = globalTranslations[language as keyof typeof globalTranslations] || globalTranslations.pl;

  const statuses = [
    { key: "paid" as const, label: globalT.colorPaid },
    { key: "invoiced" as const, label: globalT.colorInvoiced },
    { key: "defect" as const, label: globalT.colorDefect },
    { key: "completed" as const, label: globalT.colorCompleted },
  ];

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName.trim()) return;
    const ok = addEmployeeProfile(
      newEmployeeName,
      newRole,
      newRole === "mechanic" ? newUnit : undefined
    );
    if (ok) {
      setNewEmployeeName("");
    }
  };

  if (!mounted) return null;

  return (
    <Sheet>
      <SheetTrigger 
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "fixed top-4 right-4 z-50 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm")}
      >
        <SettingsIcon className="h-5 w-5" />
        <span className="sr-only">{t.settings}</span>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t.settings}</SheetTitle>
          <SheetDescription>
            {t.settingsDesc}
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          {/* Active account & access level info */}
          {currentUser && (
            <div className={cn(
              "p-3.5 rounded-xl border flex items-center justify-between gap-2",
              isAdmin ? "bg-amber-50/70 border-amber-200" : "bg-muted/40 border-border"
            )}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  "p-2 rounded-lg shrink-0",
                  isAdmin
                    ? "bg-amber-200/80 text-amber-900"
                    : currentUser.role === "mechanic"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-primary/10 text-primary"
                )}>
                  {isAdmin ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : currentUser.role === "mechanic" ? (
                    <Wrench className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-muted-foreground">{globalT.accessLevel}</div>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-black uppercase tracking-wider shrink-0",
                  isAdmin
                    ? "border-amber-300 bg-amber-100 text-amber-900"
                    : currentUser.role === "mechanic"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : "border-slate-300 bg-white text-slate-700"
                )}
              >
                {isAdmin
                  ? globalT.roleAdmin
                  : currentUser.role === "mechanic"
                  ? globalT.roleMechanic
                  : globalT.roleEmployee}
              </Badge>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="theme">{t.theme}</Label>
            <Select value={mounted ? theme : undefined} onValueChange={(v) => v && setTheme(v)}>
              <SelectTrigger id="theme">
                <SelectValue placeholder={t.theme} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    <span>{t.light}</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    <span>{t.dark}</span>
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span>{t.system}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="language">{t.language}</Label>
            <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
              <SelectTrigger id="language">
                <SelectValue placeholder={t.language} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pl">{t.polish}</SelectItem>
                <SelectItem value="en">{t.english}</SelectItem>
                <SelectItem value="de">{t.german}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentUser && canManage("settings.edit") ? (
            <>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-4">{globalT.statusColors}</h4>
                <div className="space-y-6">
                  {statuses.map((status) => (
                    <div key={status.key} className="space-y-3">
                      <Label className="text-xs text-muted-foreground">{status.label}</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableColors.map((color) => {
                          const isSelected = statusColors[status.key] === color;
                          return (
                            <button
                              key={color}
                              onClick={() => updateStatusColor(status.key, color)}
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
                                solidColorClassMap[color],
                                isSelected ? "ring-2 ring-offset-2 ring-primary" : ""
                              )}
                              title={color}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff / Employee Access Management (Admin Only) */}
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>{globalT.userManagement}</span>
                  </h4>
                </div>

                <form onSubmit={handleAddEmployee} className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setNewRole("employee")}
                      className={cn(
                        "py-1.5 rounded-md text-[11px] font-bold transition-colors",
                        newRole === "employee"
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {globalT.officeLabel} ({globalT.roleEmployee})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRole("mechanic")}
                      className={cn(
                        "py-1.5 rounded-md text-[11px] font-bold transition-colors",
                        newRole === "mechanic"
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {globalT.workshop} ({globalT.roleMechanic})
                    </button>
                  </div>

                  {newRole === "mechanic" && (
                    <Select value={newUnit} onValueChange={(v) => v && setNewUnit(v)}>
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKSHOP_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="flex gap-2">
                    <Input
                      value={newEmployeeName}
                      onChange={(e) => setNewEmployeeName(e.target.value)}
                      placeholder={globalT.employeeNamePlaceholder}
                      className="h-9 text-xs"
                    />
                    <Button type="submit" size="sm" className="h-9 px-3 shrink-0" title={globalT.addEmployee}>
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
                <p className="text-[11px] text-muted-foreground -mt-2">
                  {globalT.passwordAutoHint}
                </p>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {profiles.map((p) => {
                    const isProfileAdmin = p.role === "admin";
                    const isProfileMechanic = p.role === "mechanic";
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg border bg-muted/20 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold truncate">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate">
                            Login: {getProfileLogin(p)}
                            {p.unitName ? ` · ${p.unitName}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-bold uppercase",
                              isProfileAdmin
                                ? "border-amber-300 bg-amber-50 text-amber-900"
                                : isProfileMechanic
                                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                : ""
                            )}
                          >
                            {isProfileAdmin
                              ? globalT.roleAdmin
                              : isProfileMechanic
                              ? globalT.roleMechanic
                              : globalT.roleEmployee}
                          </Badge>
                          {!isProfileAdmin && p.id !== currentUserId && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteEmployeeProfile(p.id)}
                              className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : currentUser ? (
            <div className="pt-4 border-t">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{globalT.officeModeNotice}</span>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
