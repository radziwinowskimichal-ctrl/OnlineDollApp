"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { ArrowRightLeft, Check } from "lucide-react";
import { useApp } from "@/lib/context";
import { translations } from "@/lib/translations";
import {
  WorkshopOrder,
  WORKSHOP_UNITS,
  isOrderUnassigned,
  formatOrderAssetSummary,
} from "@/lib/workshop-types";
import { getWorkshopI18n } from "@/lib/workshop-i18n";
import { localizeUnitName } from "@/lib/workshop-text-localizer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TransferOrderDialogProps {
  order: WorkshopOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferOrderDialog({
  order,
  open,
  onOpenChange,
}: TransferOrderDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <TransferOrderDialogBody
        key={order.id}
        order={order}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  );
}

function TransferOrderDialogBody({
  order,
  onOpenChange,
}: {
  order: WorkshopOrder;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    profiles,
    transferWorkshopOrder,
    unassignWorkshopOrder,
    isOffice,
    language,
    trText,
  } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;
  const w = getWorkshopI18n(language);

  const mechanics = profiles.filter((p) => p.role === "mechanic");

  const initialUnit =
    order.unitName && WORKSHOP_UNITS.includes(order.unitName as (typeof WORKSHOP_UNITS)[number])
      ? order.unitName
      : WORKSHOP_UNITS[0];

  const [toUnit, setToUnit] = useState<string>(initialUnit);
  const [toMechanicIds, setToMechanicIds] = useState<string[]>(
    order.assignedMechanicIds || []
  );
  const [reason, setReason] = useState<string>("");

  const toggleMechanic = (id: string) => {
    setToMechanicIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (toMechanicIds.length === 0) {
      toast.error(w.errSelectTakeoverMechanic);
      return;
    }
    transferWorkshopOrder(order.id, toUnit, toMechanicIds, reason.trim() || undefined);
    toast.success(
      w.orderTransferredToast(order.orderNumber, localizeUnitName(toUnit, language))
    );
    onOpenChange(false);
  };

  const handleMoveToUnassigned = () => {
    unassignWorkshopOrder(order.id);
    toast.success(w.movedToUnassignedToast(order.orderNumber));
    onOpenChange(false);
  };

  return (
    <DialogContent className="w-[95vw] sm:w-[780px] sm:max-w-[92vw] max-h-[92dvh]">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          <span>
            {t.transferOrderBtn} · {order.orderNumber}
          </span>
        </DialogTitle>
        <p className="text-xs text-slate-500">
          {formatOrderAssetSummary(order, language, trText)}
        </p>
      </DialogHeader>

      <form onSubmit={handleConfirmTransfer} className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label className="text-xs">{t.executingUnitLabel}</Label>
          <Select value={toUnit} onValueChange={(v) => v && setToUnit(v)}>
            <SelectTrigger className="w-full">
              <SelectValue>{localizeUnitName(toUnit, language)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {WORKSHOP_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {localizeUnitName(unit, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">{w.takeoverTeamLabel}</Label>
          <div className="flex flex-wrap gap-2">
            {mechanics.map((m) => {
              const selected = toMechanicIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMechanic(m.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold min-h-[42px] transition-colors whitespace-nowrap",
                    selected
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  {selected && <Check className="w-3.5 h-3.5" />}
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{w.transferReasonLabel}</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={w.transferReasonPlaceholder}
          />
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          {isOffice &&
          !isOrderUnassigned(order) &&
          order.status !== "completed" &&
          order.status !== "rejected" ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleMoveToUnassigned}
              className="text-xs text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 whitespace-nowrap"
            >
              {w.moveToUnassignedBtn}
            </Button>
          ) : (
            <span />
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="whitespace-nowrap"
            >
              {t.cancel}
            </Button>
            <Button type="submit" className="whitespace-nowrap">
              {w.confirmTransferBtn}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
