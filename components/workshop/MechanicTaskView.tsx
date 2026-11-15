"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Play,
  Square,
  Plus,
  Trash2,
  Camera,
  Video,
  Send,
  CheckCircle2,
  ArrowRightLeft,
  Printer,
  Clock,
  Wrench,
  Users,
  Eraser,
  Loader2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useApp } from "@/lib/context";
import { translations } from "@/lib/translations";
import {
  WorkshopOrder,
  WorkshopChecklist,
  WorkshopPartItem,
  WorkshopMediaItem,
  isOrderUnassigned,
} from "@/lib/workshop-types";
import { getWorkshopI18n } from "@/lib/workshop-i18n";
import {
  localizeUnitName,
  localizePartUnit,
} from "@/lib/workshop-text-localizer";
import {
  TrailerInfoCard,
  EquipmentInfoCard,
  StatusPill,
  getScopeLabel,
  formatMinutesAsHours,
} from "./AssetInfoCards";
import { TransferOrderDialog } from "./TransferOrderDialog";
import { PrintableWorkshopProtocol } from "./PrintableWorkshopProtocol";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface MechanicTaskViewProps {
  order: WorkshopOrder;
  onBack: () => void;
}

export function MechanicTaskView({ order, onBack }: MechanicTaskViewProps) {
  const {
    currentUser,
    profiles,
    isOffice,
    workshopClientDetailsMap,
    updateWorkshopOrder,
    assignWorkshopOrder,
    submitMechanicDefectReport,
    completeWorkshopProtocol,
    language,
    trText,
  } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;
  const w = getWorkshopI18n(language);
  const mechanics = profiles.filter((p) => p.role === "mechanic");

  const activeOperatorId = currentUser?.id || "m_andy";
  const activeOperatorName = currentUser?.name || t.roleMechanic;

  // Live timer state
  const runningLog = order.timeLogs.find(
    (l) => l.mechanicId === activeOperatorId && !l.endedAt
  );
  const runningLogStartedAt = runningLog?.startedAt || "";
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [manualMinutes, setManualMinutes] = useState<string>("30");
  const [timeNote, setTimeNote] = useState<string>("");

  useEffect(() => {
    if (!runningLogStartedAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.floor((Date.now() - new Date(runningLogStartedAt).getTime()) / 1000)
      );
      setElapsedSeconds(diff);
    }, 500);
    return () => clearInterval(interval);
  }, [runningLogStartedAt]);

  // Parts form state
  const [partName, setPartName] = useState("");
  const [partCode, setPartCode] = useState("");
  const [partQty, setPartQty] = useState("1");

  // Media upload state
  const [mediaStage, setMediaStage] = useState<"before" | "defect" | "after">("defect");
  const [mediaCaption, setMediaCaption] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Defect report form state
  const [defectsList, setDefectsList] = useState<string[]>(
    order.defectReport?.defects || []
  );
  const [newDefectText, setNewDefectText] = useState("");
  const [reqPartsList, setReqPartsList] = useState<string[]>(
    order.defectReport?.requiredParts || []
  );
  const [newReqPartText, setNewReqPartText] = useState("");
  const [estHours, setEstHours] = useState<string>(
    order.defectReport?.estimatedHours
      ? String(order.defectReport.estimatedHours)
      : "2"
  );
  const [reportNotesInput, setReportNotesInput] = useState<string | null>(null);
  const effectiveReportNotes =
    reportNotesInput !== null
      ? reportNotesInput
      : order.defectReport?.notes
      ? trText(order.defectReport.notes)
      : "";

  // Finalization & Digital Signature pad
  const [wheelTorqueNm, setWheelTorqueNm] = useState<string>(
    order.wheelTorqueNm || "110"
  );
  const [finalSummaryInput, setFinalSummaryInput] = useState<string | null>(null);
  const effectiveFinalSummary =
    finalSummaryInput !== null
      ? finalSummaryInput
      : order.finalProtocol?.finalSummary
      ? trText(order.finalProtocol.finalSummary)
      : w.defaultFinalSummary;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Modals
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const totalClosedMinutes = order.timeLogs.reduce(
    (sum, l) => sum + (l.durationMinutes || 0),
    0
  );
  const liveExtraMinutes = runningLog ? Math.max(1, Math.round(elapsedSeconds / 60)) : 0;
  const totalMinutes = totalClosedMinutes + (runningLog ? liveExtraMinutes : 0);

  const formatStopwatch = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  };

  // Start / Stop Work Timer
  const handleStartTimer = () => {
    if (runningLog) return;
    const newLog = {
      id: `tl_${Date.now().toString(36)}`,
      mechanicId: activeOperatorId,
      mechanicName: activeOperatorName,
      startedAt: new Date().toISOString(),
      durationMinutes: 0,
      note: timeNote.trim() || w.defaultWorkNote,
    };
    updateWorkshopOrder({
      ...order,
      status:
        order.status === "new" || order.status === "unassigned"
          ? "in_progress"
          : order.status,
      assignedMechanicIds:
        order.assignedMechanicIds.length > 0
          ? order.assignedMechanicIds
          : [activeOperatorId],
      timeLogs: [...order.timeLogs, newLog],
    });
    toast.success(w.timerStartedToast);
  };

  const handleStopTimer = () => {
    if (!runningLog) return;
    const nowIso = new Date().toISOString();
    const mins = Math.max(
      1,
      Math.round((Date.now() - new Date(runningLog.startedAt).getTime()) / 60000)
    );
    const nextLogs = order.timeLogs.map((l) =>
      l.id === runningLog.id
        ? {
            ...l,
            endedAt: nowIso,
            durationMinutes: mins,
            note: timeNote.trim() || l.note,
          }
        : l
    );
    updateWorkshopOrder({
      ...order,
      timeLogs: nextLogs,
    });
    setTimeNote("");
    toast.success(w.timerSavedToast(mins));
  };

  const handleAddManualTime = (minsToAdd?: number) => {
    const mins = minsToAdd ?? Number(manualMinutes);
    if (!mins || mins <= 0) return;
    const now = Date.now();
    const entry = {
      id: `tl_${now.toString(36)}`,
      mechanicId: activeOperatorId,
      mechanicName: activeOperatorName,
      startedAt: new Date(now - mins * 60000).toISOString(),
      endedAt: new Date(now).toISOString(),
      durationMinutes: mins,
      note: timeNote.trim() || w.defaultWorkNote,
    };
    updateWorkshopOrder({
      ...order,
      status:
        order.status === "new" || order.status === "unassigned"
          ? "in_progress"
          : order.status,
      assignedMechanicIds:
        order.assignedMechanicIds.length > 0
          ? order.assignedMechanicIds
          : [activeOperatorId],
      timeLogs: [...order.timeLogs, entry],
    });
    setTimeNote("");
    toast.success(w.manualTimeAddedToast(mins));
  };

  const toggleChecklist = (key: keyof WorkshopChecklist) => {
    updateWorkshopOrder({
      ...order,
      status: order.status === "new" ? "in_progress" : order.status,
      checklist: {
        ...order.checklist,
        [key]: !order.checklist[key],
      },
    });
  };

  const handleAddPart = (preset?: { name: string; code: string }) => {
    const nameToUse = preset ? preset.name : partName.trim();
    const codeToUse = preset ? preset.code : partCode.trim();
    const qtyNum = preset ? 1 : Math.max(1, Number(partQty) || 1);
    if (!nameToUse) return;

    const newItem: WorkshopPartItem = {
      id: `pt_${Date.now().toString(36)}`,
      name: nameToUse,
      code: codeToUse || undefined,
      quantity: qtyNum,
      unit: w.pcsUnit,
      addedByMechanicId: activeOperatorId,
      addedByMechanicName: activeOperatorName,
      addedAt: new Date().toISOString(),
    };
    updateWorkshopOrder({
      ...order,
      status: order.status === "new" ? "in_progress" : order.status,
      partsUsed: [...order.partsUsed, newItem],
    });
    if (!preset) {
      setPartName("");
      setPartCode("");
      setPartQty("1");
    }
    toast.success(w.partAddedToast(nameToUse));
  };

  const handleRemovePart = (partId: string) => {
    updateWorkshopOrder({
      ...order,
      partsUsed: order.partsUsed.filter((p) => p.id !== partId),
    });
  };

  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingMedia(true);

    try {
      const uploadedItems: WorkshopMediaItem[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/workshop/media", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const json = await res.json();
          uploadedItems.push({
            id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            url: json.url,
            type: json.type === "video" ? "video" : "photo",
            stage: mediaStage,
            caption: mediaCaption.trim() || undefined,
            uploadedByMechanicId: activeOperatorId,
            uploadedByMechanicName: activeOperatorName,
            uploadedAt: new Date().toISOString(),
          });
        }
      }
      if (uploadedItems.length > 0) {
        updateWorkshopOrder({
          ...order,
          status: order.status === "new" ? "in_progress" : order.status,
          mediaItems: [...order.mediaItems, ...uploadedItems],
        });
        setMediaCaption("");
        toast.success(w.mediaSavedToast(uploadedItems.length));
      }
    } catch {
      toast.error(w.mediaUploadErrToast);
    } finally {
      setIsUploadingMedia(false);
      e.target.value = "";
    }
  };

  const handleSendDefectReport = () => {
    const finalDefects =
      newDefectText.trim().length > 0
        ? [...defectsList, newDefectText.trim()]
        : defectsList;
    const finalReqParts =
      newReqPartText.trim().length > 0
        ? [...reqPartsList, newReqPartText.trim()]
        : reqPartsList;

    if (finalDefects.length === 0 && !effectiveReportNotes.trim()) {
      toast.error(w.errAddReportItem);
      return;
    }

    submitMechanicDefectReport(order.id, {
      submittedAt: new Date().toISOString(),
      submittedByMechanicId: activeOperatorId,
      submittedByMechanicName: activeOperatorName,
      defects: finalDefects.length > 0 ? finalDefects : [w.noDefectsFoundFallback],
      requiredParts: finalReqParts,
      estimatedHours: Math.max(0.5, Number(estHours) || 1),
      notes: effectiveReportNotes.trim() || undefined,
    });
    setDefectsList(finalDefects);
    setReqPartsList(finalReqParts);
    setNewDefectText("");
    setNewReqPartText("");
    toast.success(w.reportSentToast);
  };

  // Canvas signature drawing handlers
  const getCanvasPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: ((touch.clientX - rect.left) * canvas.width) / rect.width,
        y: ((touch.clientY - rect.top) * canvas.height) / rect.height,
      };
    }
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    isDrawingRef.current = true;
    setHasSignature(true);
    const pt = getCanvasPoint(e);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const drawMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const pt = getCanvasPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleFinalizeProtocol = () => {
    let signatureDataUrl = order.finalProtocol?.mechanicSignatureDataUrl;
    if (hasSignature && canvasRef.current) {
      signatureDataUrl = canvasRef.current.toDataURL("image/png");
    }

    completeWorkshopProtocol(order.id, {
      completedAt: new Date().toISOString(),
      totalMinutes,
      wheelTorqueNm: wheelTorqueNm.trim() || undefined,
      mechanicSignatureDataUrl: signatureDataUrl,
      signedByMechanicName: activeOperatorName,
      finalSummary: effectiveFinalSummary.trim() || w.defaultFinalSummary,
    });
    toast.success(w.protocolFinalizedToast);
  };

  const orderUnassigned = isOrderUnassigned(order);
  const assignedMechanicNames = order.assignedMechanicIds.map(
    (id) => mechanics.find((m) => m.id === id)?.name || id
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="min-h-[44px] gap-2 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{w.backToOrdersList}</span>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={order.status} lang={language} />
          <Button
            variant="outline"
            onClick={() => setIsTransferOpen(true)}
            className="min-h-[44px] gap-1.5 text-xs font-semibold"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{w.handoverUnitBtn}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsPrintOpen(true)}
            className="min-h-[44px] gap-1.5 text-xs font-semibold"
          >
            <Printer className="w-4 h-4" />
            <span>{w.pdfProtocolShortBtn}</span>
          </Button>
        </div>
      </div>

      {/* Top Alert Banner for Defect / Client Approval Status */}
      {(order.status === "report_sent" || order.status === "waiting_client") && (
        <div
          role="alert"
          className="rounded-xl bg-red-600 text-white border-2 border-red-800 p-4 sm:p-5 shadow-md flex items-start gap-3.5"
        >
          <AlertTriangle className="w-7 h-7 shrink-0 mt-0.5 text-white" />
          <div className="space-y-1">
            <div className="text-sm sm:text-base font-black tracking-wide uppercase">
              {w.waitingApprovalBannerTitle}
            </div>
            <p className="text-xs sm:text-sm font-medium text-red-50">
              {w.waitingApprovalBannerDesc}
            </p>
          </div>
        </div>
      )}

      {order.status === "rejected" && (
        <div
          role="alert"
          className="rounded-xl bg-rose-700 text-white border-2 border-rose-900 p-4 sm:p-5 shadow-md flex items-start gap-3.5"
        >
          <XCircle className="w-7 h-7 shrink-0 mt-0.5 text-white" />
          <div className="space-y-1">
            <div className="text-sm sm:text-base font-black tracking-wide uppercase">
              {w.orderRejectedBannerTitle}
            </div>
            <p className="text-xs sm:text-sm font-medium text-rose-100">
              {w.orderRejectedBannerDesc}
            </p>
          </div>
        </div>
      )}

      {order.status === "approved" && (
        <div className="rounded-xl bg-emerald-600 text-white border border-emerald-700 px-4 py-3 shadow-xs flex items-center gap-2.5 text-xs sm:text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{w.clientApprovedBanner}</span>
        </div>
      )}

      {/* Step 2: RODO-Safe Equipment / Trailer Header Card (ZERO Customer PII) */}
      {order.assetCategory === "equipment" ? (
        <EquipmentInfoCard order={order} showRodoNotice lang={language} />
      ) : (
        <TrailerInfoCard order={order} showRodoNotice lang={language} />
      )}

      {/* Team & Scope Banner */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
            <Users className="w-4 h-4 text-primary" />
            <span>
              {w.unitPrefix}: {localizeUnitName(order.unitName, language)}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {w.teamPrefix}:{" "}
              {orderUnassigned
                ? w.unassignedStatusLabel
                : assignedMechanicNames.join(", ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {orderUnassigned && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  assignWorkshopOrder(
                    order.id,
                    [activeOperatorId],
                    currentUser?.unitName
                  );
                  toast.success(w.orderClaimedToast(order.orderNumber));
                }}
                className="h-8 text-xs font-semibold whitespace-nowrap"
              >
                {w.takeOrderSelfBtn}
              </Button>
            )}
            <div className="font-mono text-slate-500 tabular-nums">
              {w.totalTeamTimeLabel}{" "}
              <strong>{formatMinutesAsHours(totalMinutes)}</strong>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {order.scopeTypes.map((sc) => (
            <span
              key={sc}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap"
            >
              {getScopeLabel(sc, language)}
            </span>
          ))}
        </div>

        {order.taskInstructions.length > 0 && (
          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {w.tasksTodoTitle}
            </div>
            <ul className="list-disc pl-5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              {order.taskInstructions.map((inst, idx) => (
                <li key={idx}>{trText(inst)}</li>
              ))}
            </ul>
          </div>
        )}

        {order.transferHistory.length > 0 && (
          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              {w.transferHistoryTitle}
            </div>
            {order.transferHistory.map((tr) => (
              <div key={tr.id}>
                • {format(parseISO(tr.timestamp), "dd.MM HH:mm")}:{" "}
                {localizeUnitName(tr.fromUnit, language)} →{" "}
                <strong>{localizeUnitName(tr.toUnit, language)}</strong> (
                {tr.reason ? trText(tr.reason) : w.continuedWorkFallback})
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 3A & 3B: Work Stopwatch + Doll Fahrzeugbau Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Work Timer Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{w.timerCardTitle}</span>
            </h3>
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {w.sumPrefix} {formatMinutesAsHours(totalMinutes)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {runningLog ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleStopTimer}
                className="min-h-[52px] flex-1 text-sm font-bold gap-2"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>
                  {w.stopBtn} ({formatStopwatch(elapsedSeconds)})
                </span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleStartTimer}
                className="min-h-[52px] flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {w.startWorkBtn} ({activeOperatorName})
                </span>
              </Button>
            )}

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddManualTime(30)}
                className="min-h-[52px] px-3 text-xs font-mono font-bold"
              >
                +30m
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddManualTime(60)}
                className="min-h-[52px] px-3 text-xs font-mono font-bold"
              >
                +1h
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              value={timeNote}
              onChange={(e) => setTimeNote(e.target.value)}
              placeholder={w.workNotePlaceholder}
              className="h-10 text-xs"
            />
            <Input
              type="number"
              min="5"
              step="5"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              className="w-20 h-10 text-xs font-mono tabular-nums"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleAddManualTime()}
              className="h-10 text-xs shrink-0"
            >
              {w.addMinBtn}
            </Button>
          </div>

          {order.timeLogs.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 max-h-40 overflow-y-auto">
              {order.timeLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60"
                >
                  <div>
                    <span className="font-bold">{log.mechanicName}</span>
                    <span className="text-slate-500 ml-2">
                      {log.note ? trText(log.note) : ""}
                    </span>
                  </div>
                  <span className="font-mono font-semibold tabular-nums">
                    {log.endedAt ? `${log.durationMinutes} min` : w.inProgressTimer}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doll Fahrzeugbau Technical Inspection Checklist */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            <span>{w.checklistCardTitle}</span>
          </h3>

          <div className="space-y-2">
            {(
              [
                { key: "beweglicheTeile", label: w.checkBeweglicheTeile },
                { key: "luftdruck", label: w.checkLuftdruck },
                { key: "bremsen", label: w.checkBremsen },
                { key: "elektrikGeprueft", label: w.checkElektrik },
                { key: "raederFestgezogen", label: w.checkRaeder },
              ] as Array<{ key: keyof WorkshopChecklist; label: string }>
            ).map((item) => {
              const checked = order.checklist[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleChecklist(item.key)}
                  className={cn(
                    "w-full min-h-[46px] px-3.5 py-2.5 rounded-lg border text-left text-xs font-semibold flex items-center justify-between transition-colors",
                    checked
                      ? "border-emerald-300 bg-emerald-50/70 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200"
                      : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300"
                  )}
                >
                  <span>{item.label}</span>
                  <CheckCircle2
                    className={cn(
                      "w-4 h-4 shrink-0",
                      checked ? "text-emerald-600" : "text-slate-300"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step 3C & 3D: Parts Used + Camera / Video Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Parts & Materials Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {w.partsCardTitle}
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {w.partPresets.map((preset) => (
              <button
                key={preset.code}
                type="button"
                onClick={() => handleAddPart(preset)}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-[11px] font-medium transition-colors"
              >
                + {preset.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <Input
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder={w.partNamePlaceholder}
              className="sm:col-span-6 h-10 text-xs"
            />
            <Input
              value={partCode}
              onChange={(e) => setPartCode(e.target.value)}
              placeholder={w.partCodePlaceholder}
              className="sm:col-span-3 h-10 text-xs font-mono"
            />
            <Input
              type="number"
              min="1"
              value={partQty}
              onChange={(e) => setPartQty(e.target.value)}
              className="sm:col-span-1 h-10 text-xs font-mono px-2 text-center"
            />
            <Button
              type="button"
              onClick={() => handleAddPart()}
              className="sm:col-span-2 h-10 text-xs"
            >
              {w.addBtn}
            </Button>
          </div>

          {order.partsUsed.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {order.partsUsed.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs"
                >
                  <div>
                    <span className="font-semibold">{trText(p.name)}</span>
                    {p.code && (
                      <span className="ml-2 font-mono text-[11px] text-slate-500">
                        [{p.code}]
                      </span>
                    )}
                    <span className="ml-2 text-[11px] text-slate-400">
                      ({p.addedByMechanicName})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold tabular-nums">
                      {p.quantity} {localizePartUnit(p.unit, language)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(p.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Camera & Video Upload Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {w.mediaCardTitle}
          </h3>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            {(
              [
                { id: "before", label: w.stageBefore },
                { id: "defect", label: w.stageDefect },
                { id: "after", label: w.stageAfter },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setMediaStage(st.id)}
                className={cn(
                  "py-1.5 rounded-md font-semibold transition-colors",
                  mediaStage === st.id
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>

          <Input
            value={mediaCaption}
            onChange={(e) => setMediaCaption(e.target.value)}
            placeholder={w.mediaCaptionPlaceholder}
            className="h-10 text-xs"
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-2 text-xs font-bold transition-colors px-2 text-center">
              {isUploadingMedia ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <Camera className="w-4 h-4 shrink-0" />
              )}
              <span>{w.takePhotoUploadBtn}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                disabled={isUploadingMedia}
                onChange={handleMediaFileUpload}
              />
            </label>

            <label className="cursor-pointer min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 flex items-center justify-center gap-2 text-xs font-bold transition-colors px-2 text-center">
              <Video className="w-4 h-4 shrink-0" />
              <span>{w.recordVideoBtn}</span>
              <input
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                disabled={isUploadingMedia}
                onChange={handleMediaFileUpload}
              />
            </label>
          </div>

          {order.mediaItems.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {order.mediaItems.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50"
                >
                  <div className="aspect-video bg-slate-900">
                    {m.type === "video" ? (
                      <video src={m.url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={m.url}
                        alt={m.caption || "Media"}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-1.5 text-[10px] truncate text-slate-600">
                    <strong>[{m.stage}]</strong>{" "}
                    {m.caption ? trText(m.caption) : m.uploadedByMechanicName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Step 3E: Defect Report Form -> Sent to Office for Client Approval */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/70 bg-amber-50/25 dark:bg-amber-950/15 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{w.defectReportCardTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{w.defectReportCardDesc}</p>
          </div>
          {order.status === "approved" && (
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {w.clientApprovedBanner}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{w.detectedDefectsLabel}</Label>
            <div className="flex gap-2">
              <Input
                value={newDefectText}
                onChange={(e) => setNewDefectText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newDefectText.trim()) {
                    e.preventDefault();
                    setDefectsList((prev) => [...prev, newDefectText.trim()]);
                    setNewDefectText("");
                  }
                }}
                placeholder={w.defectInputPlaceholder}
                className="h-10 text-xs bg-white dark:bg-slate-900"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!newDefectText.trim()) return;
                  setDefectsList((prev) => [...prev, newDefectText.trim()]);
                  setNewDefectText("");
                }}
                className="h-10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {defectsList.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs px-3 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <span>• {trText(d)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDefectsList((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">{w.requiredPartsOrderLabel}</Label>
            <div className="flex gap-2">
              <Input
                value={newReqPartText}
                onChange={(e) => setNewReqPartText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newReqPartText.trim()) {
                    e.preventDefault();
                    setReqPartsList((prev) => [...prev, newReqPartText.trim()]);
                    setNewReqPartText("");
                  }
                }}
                placeholder={w.reqPartInputPlaceholder}
                className="h-10 text-xs bg-white dark:bg-slate-900"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!newReqPartText.trim()) return;
                  setReqPartsList((prev) => [...prev, newReqPartText.trim()]);
                  setNewReqPartText("");
                }}
                className="h-10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {reqPartsList.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs px-3 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <span>• {trText(p)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setReqPartsList((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">{w.estRepairHoursLabel}</Label>
            <Input
              type="number"
              step="0.5"
              min="0.5"
              value={estHours}
              onChange={(e) => setEstHours(e.target.value)}
              className="h-10 bg-white dark:bg-slate-900 font-mono tabular-nums"
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs">{w.techNotesForOfficeLabel}</Label>
            <Input
              value={effectiveReportNotes}
              onChange={(e) => setReportNotesInput(e.target.value)}
              placeholder={w.techNotesPlaceholder}
              className="h-10 text-xs bg-white dark:bg-slate-900"
            />
          </div>
          <Button
            type="button"
            onClick={handleSendDefectReport}
            className="min-h-[44px] gap-2 font-bold"
          >
            <Send className="w-4 h-4" />
            <span>{w.sendReportToOfficeBtn}</span>
          </Button>
        </div>
      </div>

      {/* Step 5: Finalization & Digital Signature Pad */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {w.finalizeCardTitle}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3 md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{w.wheelTorqueLabel}</Label>
                <Input
                  value={wheelTorqueNm}
                  onChange={(e) => setWheelTorqueNm(e.target.value)}
                  placeholder="110"
                  className="h-10 font-mono"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">{w.finalSummaryLabel}</Label>
                <Input
                  value={effectiveFinalSummary}
                  onChange={(e) => setFinalSummaryInput(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-4">
              <span>
                {w.totalTeamTimeLabel}{" "}
                <strong>{formatMinutesAsHours(totalMinutes)}</strong>
              </span>
              <span>
                {w.usedPartsCountLabel} <strong>{order.partsUsed.length}</strong>
              </span>
              <span>
                {w.mediaFilesCountLabel} <strong>{order.mediaItems.length}</strong>
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                {w.digitalSignatureLabel} ({activeOperatorName})
              </Label>
              <button
                type="button"
                onClick={clearSignature}
                className="text-[11px] text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
              >
                <Eraser className="w-3 h-3" />
                {w.clearSignatureBtn}
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={320}
              height={110}
              onMouseDown={startDrawing}
              onMouseMove={drawMove}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={drawMove}
              onTouchEnd={stopDrawing}
              className="w-full h-28 rounded-lg border border-slate-300 bg-white touch-none cursor-crosshair"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={handleFinalizeProtocol}
            disabled={order.status === "completed"}
            className="min-h-[48px] px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {order.status === "completed"
                ? w.orderCompletedBtnLabel
                : w.finishAndSaveProtocolBtn}
            </span>
          </Button>
        </div>
      </div>

      <TransferOrderDialog
        order={order}
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
      />

      <PrintableWorkshopProtocol
        order={order}
        clientDetails={isOffice ? workshopClientDetailsMap[order.id] : undefined}
        mechanics={mechanics}
        isOffice={isOffice}
        lang={language}
        open={isPrintOpen}
        onOpenChange={setIsPrintOpen}
      />
    </div>
  );
}
