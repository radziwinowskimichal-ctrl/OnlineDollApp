"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Check,
  X,
  Wrench,
  Clock,
  KeyRound,
} from "lucide-react";
import { useApp } from "@/lib/context";
import { getProfileLogin, UserProfile } from "@/lib/store";
import { translations } from "@/lib/translations";
import { WORKSHOP_UNITS, isOrderUnassigned } from "@/lib/workshop-types";
import { getWorkshopI18n } from "@/lib/workshop-i18n";
import { localizeUnitName } from "@/lib/workshop-text-localizer";
import { formatMinutesAsHours } from "./AssetInfoCards";
import { toast } from "sonner";

interface MechanicsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MechanicsManagerDialog({
  open,
  onOpenChange,
}: MechanicsManagerDialogProps) {
  const {
    profiles,
    workshopOrders,
    addEmployeeProfile,
    updateMechanicProfile,
    deleteEmployeeProfile,
    language,
    trText,
  } = useApp();

  const t = translations[language as keyof typeof translations] || translations.pl;
  const w = getWorkshopI18n(language);

  const mechanics = profiles.filter((p) => p.role === "mechanic");

  // Add new mechanic form state
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState<string>(WORKSHOP_UNITS[0]);
  const [newSpecialty, setNewSpecialty] = useState("");

  // Edit existing mechanic state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState<string>(WORKSHOP_UNITS[0]);
  const [editSpecialty, setEditSpecialty] = useState("");

  const handleAddMechanic = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const ok = addEmployeeProfile(
      trimmedName,
      "mechanic",
      newUnit,
      newSpecialty.trim() || undefined
    );
    if (ok) {
      setNewName("");
      setNewSpecialty("");
    }
  };

  const startEditing = (m: UserProfile) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditUnit(m.unitName || WORKSHOP_UNITS[0]);
    setEditSpecialty(m.specialty ? trText(m.specialty) : "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditSpecialty("");
  };

  const handleSaveEdit = (id: string) => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;
    const ok = updateMechanicProfile(id, {
      name: trimmedName,
      unitName: editUnit,
      specialty: editSpecialty.trim(),
    });
    if (ok) {
      toast.success(w.mechanicUpdatedToast(trimmedName));
      setEditingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:w-[94vw] sm:max-w-[94vw] max-h-[94dvh]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            <span>
              {w.mechanicsModalTitle} ({mechanics.length})
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {w.mechanicsModalDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Add New Mechanic Form */}
          <form
            onSubmit={handleAddMechanic}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3.5"
          >
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>{w.addNewMechanicHeading}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{w.mechanicNameInputLabel}</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={w.mechanicNamePlaceholder}
                  className="h-9 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{w.defaultUnitSelectLabel}</Label>
                <Select value={newUnit} onValueChange={(v) => v && setNewUnit(v)}>
                  <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 w-full">
                    <SelectValue>{localizeUnitName(newUnit, language)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {WORKSHOP_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {localizeUnitName(u, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{w.mechanicSpecialtyLabel}</Label>
                <Input
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder={w.mechanicSpecialtyPlaceholder}
                  className="h-9 text-xs bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {newName.trim()
                    ? w.credentialsHint(newName.trim())
                    : w.credentialsHint("Imię")}
                </span>
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={!newName.trim()}
                className="gap-1.5 font-semibold whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{w.addMechanicSubmitBtn}</span>
              </Button>
            </div>
          </form>

          {/* Existing Mechanics Roster */}
          <div className="space-y-2.5">
            {mechanics.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
                {w.noMechanicsYet}
              </div>
            ) : (
              mechanics.map((m) => {
                const isEditing = editingId === m.id;
                const activeCount = workshopOrders.filter(
                  (o) =>
                    !isOrderUnassigned(o) &&
                    o.assignedMechanicIds.includes(m.id) &&
                    o.status !== "completed" &&
                    o.status !== "rejected"
                ).length;
                const completedCount = workshopOrders.filter(
                  (o) =>
                    o.assignedMechanicIds.includes(m.id) && o.status === "completed"
                ).length;
                const loggedMins = workshopOrders.reduce(
                  (sum, o) =>
                    sum +
                    o.timeLogs
                      .filter((l) => l.mechanicId === m.id)
                      .reduce((s, l) => s + (l.durationMinutes || 0), 0),
                  0
                );
                const loginStr = getProfileLogin(m);

                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="space-y-1">
                            <Label className="text-xs">{w.mechanicNameInputLabel}</Label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{w.defaultUnitSelectLabel}</Label>
                            <Select
                              value={editUnit}
                              onValueChange={(v) => v && setEditUnit(v)}
                            >
                              <SelectTrigger className="h-9 text-xs w-full">
                                <SelectValue>
                                  {localizeUnitName(editUnit, language)}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {WORKSHOP_UNITS.map((u) => (
                                  <SelectItem key={u} value={u}>
                                    {localizeUnitName(u, language)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{w.mechanicSpecialtyLabel}</Label>
                            <Input
                              value={editSpecialty}
                              onChange={(e) => setEditSpecialty(e.target.value)}
                              placeholder={w.mechanicSpecialtyPlaceholder}
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={cancelEditing}
                            className="h-8 text-xs gap-1 whitespace-nowrap"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{t.cancel}</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSaveEdit(m.id)}
                            className="h-8 text-xs gap-1 whitespace-nowrap"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{w.saveChangesBtn}</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {m.name}
                            </span>
                            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                              ·
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {localizeUnitName(m.unitName || WORKSHOP_UNITS[0], language)}
                            </span>
                          </div>

                          {m.specialty && (
                            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{trText(m.specialty)}</span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-mono tabular-nums pt-0.5">
                            <span>{w.credentialsHint(loginStr)}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {w.activeWorkloadLabel}:{" "}
                              <strong className="text-slate-800 dark:text-slate-200">
                                {activeCount}
                              </strong>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {w.completedOrdersCountLabel}:{" "}
                              <strong className="text-slate-800 dark:text-slate-200">
                                {completedCount}
                              </strong>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {w.loggedHoursCountLabel}:{" "}
                              <strong className="text-slate-800 dark:text-slate-200">
                                {formatMinutesAsHours(loggedMins)}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(m)}
                            className="h-8 text-xs gap-1.5 whitespace-nowrap"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>{w.editMechanicBtn}</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEmployeeProfile(m.id)}
                            className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1 whitespace-nowrap"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{w.deleteMechanicBtn}</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="whitespace-nowrap"
          >
            {w.closeBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
