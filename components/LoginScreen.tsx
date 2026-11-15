"use client";

import React, { useState, useRef } from "react";
import { User, LogIn, ShieldCheck, Lock, Eye, EyeOff, AlertCircle, KeyRound, Wrench } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/lib/context";
import { getProfileLogin, UserProfile } from "@/lib/store";
import { translations } from "@/lib/translations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function LoginScreen() {
  const { profiles, authenticateUser, language, setLanguage } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<"all" | "office" | "mechanic">("all");
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleSelectProfile = (profile: UserProfile) => {
    const loginName = getProfileLogin(profile);
    setSelectedProfileId(profile.id);
    setUsername(loginName);
    setPassword("");
    setErrorMsg(null);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg(t.fillAllFields);
      return;
    }

    const res = authenticateUser(username, password);
    if (!res.success) {
      setErrorMsg(res.error || t.invalidCredentials);
      return;
    }

    if (res.user) {
      const roleLabel =
        res.user.role === "admin"
          ? t.roleAdmin
          : res.user.role === "mechanic"
          ? t.roleMechanic
          : t.roleEmployee;
      toast.success(`${res.user.name} (${roleLabel})`);
    }
  };

  const visibleProfiles = profiles.filter((p) => {
    if (roleFilter === "office") return p.role === "admin" || p.role === "employee";
    if (roleFilter === "mechanic") return p.role === "mechanic";
    return true;
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-3 sm:p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary overflow-hidden">
        <CardHeader className="text-center pb-5 border-b bg-muted/10 flex flex-col items-center relative">
          {/* Quick Language Switcher */}
          <div className="flex items-center gap-1 self-end mb-2">
            {(["pl", "de", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors border",
                  language === lang
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {lang}
              </button>
            ))}
          </div>

          <Logo textSize="xl" iconSize={30} className="mb-3" />
          <CardTitle className="text-lg font-black tracking-tight">{t.signInTitle}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{t.enterCredentials}</CardDescription>
        </CardHeader>

        <CardContent className="pt-6 px-5 sm:px-7 pb-7 space-y-6">
          {/* Login & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t.loginLabel}
              </Label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="admin / Steffi / Andy"
                  className="pl-9 h-11 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t.passwordLabel}
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  ref={passwordInputRef}
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="••••••••"
                  className="pl-9 pr-10 h-11 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-11 font-black uppercase tracking-wide text-sm shadow-md shadow-primary/20">
              <LogIn className="w-4 h-4 mr-2" />
              {t.login}
            </Button>
          </form>

          {/* Quick-Select Profiles with Biuro / Warsztat separation */}
          <div className="space-y-2.5 pt-2 border-t">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t.quickSelectProfile}
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                {(
                  [
                    { id: "all", label: t.filterAll || "All" },
                    { id: "office", label: t.officeLabel || "Office" },
                    { id: "mechanic", label: t.workshop || "Workshop" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRoleFilter(tab.id)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors",
                      roleFilter === tab.id
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
              {visibleProfiles.map((profile) => {
                const isProfileAdmin = profile.role === "admin";
                const isProfileMechanic = profile.role === "mechanic";
                const isSelected = selectedProfileId === profile.id;
                const loginName = getProfileLogin(profile);

                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleSelectProfile(profile)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all text-left active:scale-[0.99]",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/40 bg-background"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "p-2 rounded-lg shrink-0",
                          isProfileAdmin
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : isProfileMechanic
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        )}
                      >
                        {isProfileAdmin ? (
                          <ShieldCheck className="w-4 h-4" />
                        ) : isProfileMechanic ? (
                          <Wrench className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate flex items-center gap-2">
                          <span>{profile.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            ({loginName})
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold text-muted-foreground truncate">
                          {isProfileAdmin
                            ? t.roleAdmin
                            : isProfileMechanic
                            ? `${t.roleMechanic}${profile.unitName ? ` · ${profile.unitName}` : ""}`
                            : t.roleEmployee}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {profile.isOnline && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px] px-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                          Online
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-black uppercase px-1.5 py-0.5",
                          isProfileAdmin
                            ? "border-amber-300 bg-amber-50 text-amber-900"
                            : isProfileMechanic
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                        )}
                      >
                        {isProfileAdmin
                          ? t.roleAdmin
                          : isProfileMechanic
                          ? t.roleMechanic
                          : t.roleEmployee}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Access rules info box */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <KeyRound className="w-3.5 h-3.5 text-primary" />
              <span>{t.accessLevel}:</span>
            </div>
            <p>• {t.loginHintAdmin}</p>
            <p>• {t.loginHintEmployee}</p>
            <p>• {t.loginHintMechanic}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
