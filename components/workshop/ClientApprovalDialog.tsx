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
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Wrench,
  Clock,
  ShieldAlert,
  FileImage,
} from "lucide-react";
import { useApp } from "@/lib/context";
import { translations } from "@/lib/translations";
import { WorkshopOrder, formatOrderAssetSummary } from "@/lib/workshop-types";
import { getWorkshopI18n } from "@/lib/workshop-i18n";
import { localizeUnitName } from "@/lib/workshop-text-localizer";
import { formatMinutesAsHours } from "./AssetInfoCards";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface ClientApprovalDialogProps {
  order: WorkshopOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientApprovalDialog({
  order,
  open,
  onOpenChange,
}: ClientApprovalDialogProps) {
  const { language } = useApp();
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ClientApprovalDialogBody
        key={`${order.id}_${language}`}
        order={order}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  );
}

function ClientApprovalDialogBody({
  order,
  onOpenChange,
}: {
  order: WorkshopOrder;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    workshopClientDetailsMap,
    submitClientApprovalDecision,
    updateWorkshopClientDetails,
    language,
    trText,
  } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;
  const w = getWorkshopI18n(language);

  const clientDetails = workshopClientDetailsMap[order.id];

  const [costEur, setCostEur] = useState<string>(
    clientDetails?.estimatedCostEur !== undefined
      ? String(clientDetails.estimatedCostEur)
      : ""
  );
  const [decisionNote, setDecisionNote] = useState<string>(
    clientDetails?.clientDecisionNote ? trText(clientDetails.clientDecisionNote) : ""
  );

  const totalLoggedMinutes = order.timeLogs.reduce(
    (sum, l) => sum + (l.durationMinutes || 0),
    0
  );

  const handleMarkCommunicated = () => {
    if (!clientDetails) return;
    updateWorkshopClientDetails({
      ...clientDetails,
      estimatedCostEur: costEur ? Number(costEur) : clientDetails.estimatedCostEur,
      costCommunicatedAt: new Date().toISOString(),
      clientDecisionNote: decisionNote.trim() || clientDetails.clientDecisionNote,
    });
    toast.success(w.costCommunicatedToast);
  };

  const handleDecision = (decision: "approved" | "rejected") => {
    submitClientApprovalDecision(
      order.id,
      decision,
      costEur ? Number(costEur) : undefined,
      decisionNote.trim()
    );
    toast.success(
      decision === "approved" ? w.approvedDecisionToast : w.rejectedDecisionToast
    );
    onOpenChange(false);
  };

  return (
    <DialogContent className="w-[96vw] sm:w-[94vw] sm:max-w-[94vw] max-h-[94dvh]">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold tracking-tight">
          {t.clientApprovalBtn} · {order.orderNumber}
        </DialogTitle>
        <p className="text-xs text-slate-500">
          {formatOrderAssetSummary(order, language, trText)} ·{" "}
          {localizeUnitName(order.unitName, language)}
        </p>
      </DialogHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 py-2 items-start">
        {/* Office-Only Customer Contact Card */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              {w.clientContactOfficeOnlyBadge}
            </span>
            {clientDetails?.costCommunicatedAt && (
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {w.contactTimestampPrefix}{" "}
                {format(parseISO(clientDetails.costCommunicatedAt), "dd.MM.yyyy HH:mm")}
              </span>
            )}
          </div>

          <div className="text-base font-bold text-slate-900 dark:text-slate-100">
            {clientDetails?.clientName || w.noClientNameFallback}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-slate-700 dark:text-slate-300">
            {(clientDetails?.phone || clientDetails?.mobile) && (
              <a
                href={`tel:${clientDetails.mobile || clientDetails.phone}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium hover:border-primary"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-mono tabular-nums">
                  {clientDetails.mobile || clientDetails.phone}
                </span>
              </a>
            )}
            {clientDetails?.email && (
              <a
                href={`mailto:${clientDetails.email}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium hover:border-primary"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>{clientDetails.email}</span>
              </a>
            )}
            {(clientDetails?.street || clientDetails?.city) && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {[clientDetails.street, clientDetails.city].filter(Boolean).join(", ")}
                </span>
              </span>
            )}
          </div>

          {clientDetails?.officeInternalNotes && (
            <p className="text-xs text-amber-900/90 dark:text-amber-200/90 pt-1">
              {trText(clientDetails.officeInternalNotes)}
            </p>
          )}

          {clientDetails?.auftragScanUrl && (
            <div className="pt-2">
              <a
                href={clientDetails.auftragScanUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <FileImage className="w-3.5 h-3.5" />
                <span>{w.openScannedAuftragLink}</span>
              </a>
            </div>
          )}
        </div>

        {/* Mechanic Defect Report Summary */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-slate-500" />
              <span>{w.workshopDefectReportHeading}</span>
            </h4>
            <span className="text-xs font-mono text-slate-500 tabular-nums flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {w.elapsedTimePrefix} {formatMinutesAsHours(totalLoggedMinutes)}
            </span>
          </div>

          {order.defectReport ? (
            <div className="space-y-3 text-xs">
              <div className="text-slate-500">
                {w.reportedByMechanicPrefix}{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {order.defectReport.submittedByMechanicName}
                </strong>{" "}
                · {w.estCompletionTimePrefix}{" "}
                <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                  {order.defectReport.estimatedHours} h
                </strong>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  {w.detectedDefectsLabel}:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                  {order.defectReport.defects.map((d, idx) => (
                    <li key={idx}>{trText(d)}</li>
                  ))}
                </ul>
              </div>

              {order.defectReport.requiredParts.length > 0 && (
                <div className="space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    {w.requiredPartsOrderLabel}:
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                    {order.defectReport.requiredParts.map((p, idx) => (
                      <li key={idx}>{trText(p)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {order.defectReport.notes && (
                <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                  {trText(order.defectReport.notes)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{w.noFormalReportYetText}</p>
          )}

          {order.mediaItems.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-600 mb-2">
                {w.damageMediaHeading} ({order.mediaItems.length}):
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {order.mediaItems.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100"
                  >
                    {m.type === "video" ? (
                      <video src={m.url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={m.url}
                        alt={m.caption ? trText(m.caption) : "Media"}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cost Quote & Decision Inputs */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <Label className="text-xs">{w.totalClientCostEurLabel}</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={costEur}
              onChange={(e) => setCostEur(e.target.value)}
              placeholder="890"
              className="font-mono tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{w.clientConversationNoteLabel}</Label>
            <Input
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder={w.clientConversationNotePlaceholder}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleMarkCommunicated}
              className="w-full text-xs"
            >
              {w.markCostCommunicatedBtn}
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
        <Button
          type="button"
          variant="destructive"
          onClick={() => handleDecision("rejected")}
          className="gap-1.5"
        >
          <XCircle className="w-4 h-4" />
          {t.rejectRepairBtn}
        </Button>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => handleDecision("approved")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {t.approveRepairBtn}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
