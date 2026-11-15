"use client";

import React, { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Wrench,
  Bell,
  ScanLine,
  Search,
  ShieldCheck,
  Users,
  UserPlus,
  Clock,
  ArrowRightLeft,
  Printer,
  Trash2,
  Phone,
  CheckCheck,
  Check,
  Truck,
  Cog,
  ChevronRight,
  Eye,
  LayoutGrid,
  Inbox,
  List,
  Loader2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useApp } from "@/lib/context";
import { UserProfile } from "@/lib/store";
import { translations } from "@/lib/translations";
import {
  WorkshopOrder,
  WorkshopOrderClientDetails,
  WORKSHOP_UNITS,
  isOrderUnassigned,
  formatOrderAssetSummary,
} from "@/lib/workshop-types";
import { getWorkshopI18n, WorkshopI18n } from "@/lib/workshop-i18n";
import {
  localizeUnitName,
  localizeVehicleType,
} from "@/lib/workshop-text-localizer";
import {
  StatusPill,
  formatMinutesAsHours,
  getScopeLabel,
} from "./AssetInfoCards";
import { WorkOrderScannerModal } from "./WorkOrderScannerModal";
import { ClientApprovalDialog } from "./ClientApprovalDialog";
import { TransferOrderDialog } from "./TransferOrderDialog";
import { PrintableWorkshopProtocol } from "./PrintableWorkshopProtocol";
import { MechanicsManagerDialog } from "./MechanicsManagerDialog";
import { MechanicTaskView } from "./MechanicTaskView";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

/**
 * Unassigned Order Card with Inline Quick Assignment (Office)
 */
function UnassignedOrderCard({
  order,
  client,
  mechanics,
  language,
  w,
  trText,
  canManage,
  onAssign,
  onOpenOrder,
  onOpenApproval,
  onOpenPrint,
  onDeleteOrder,
  onOpenMechanicsManager,
}: {
  order: WorkshopOrder;
  client?: WorkshopOrderClientDetails;
  mechanics: UserProfile[];
  language: string;
  w: WorkshopI18n;
  trText: (val?: string) => string;
  canManage: (action: "workshop.delete") => boolean;
  onAssign: (orderId: string, mechanicIds: string[], unitName: string) => void;
  onOpenOrder: (id: string) => void;
  onOpenApproval: (order: WorkshopOrder) => void;
  onOpenPrint: (order: WorkshopOrder) => void;
  onDeleteOrder: (id: string) => void;
  onOpenMechanicsManager: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    mechanics[0] ? [mechanics[0].id] : []
  );
  const [selectedUnit, setSelectedUnit] = useState<string>(
    mechanics[0]?.unitName &&
      WORKSHOP_UNITS.includes(mechanics[0].unitName as (typeof WORKSHOP_UNITS)[number])
      ? mechanics[0].unitName
      : WORKSHOP_UNITS[0]
  );

  const toggleMechanic = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((m) => m !== id)
        : [...prev, id];
      if (next.length === 1) {
        const mech = mechanics.find((m) => m.id === next[0]);
        if (
          mech?.unitName &&
          WORKSHOP_UNITS.includes(mech.unitName as (typeof WORKSHOP_UNITS)[number])
        ) {
          setSelectedUnit(mech.unitName);
        }
      }
      return next;
    });
  };

  const handleAssignSubmit = () => {
    if (selectedIds.length === 0) {
      toast.error(w.errAssignMechanic);
      return;
    }
    const names = selectedIds
      .map((id) => mechanics.find((m) => m.id === id)?.name || id)
      .join(", ");
    onAssign(order.id, selectedIds, selectedUnit);
    toast.success(w.orderAssignedToast(order.orderNumber, names));
  };

  const assetDesc =
    order.assetCategory === "equipment"
      ? order.equipmentDescription
        ? trText(order.equipmentDescription)
        : ""
      : order.vehicleSubtype
      ? trText(order.vehicleSubtype)
      : "";

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        {/* Left: Technical Asset & Office Client Summary */}
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 tabular-nums">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {order.orderNumber}
              </span>
              <span aria-hidden="true">·</span>
              <span>{format(parseISO(order.createdAt), "dd.MM.yyyy HH:mm")}</span>
            </div>
            <StatusPill status="unassigned" lang={language} />
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              {order.assetCategory === "equipment" ? (
                <Cog className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              ) : (
                <Truck className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {formatOrderAssetSummary(order, language, trText)}
              </h3>
              {assetDesc && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {assetDesc}
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-700 dark:text-slate-300">
            <strong>{w.scopePrefix}</strong>{" "}
            {order.scopeTypes.map((s) => getScopeLabel(s, language)).join(" · ")}
          </div>

          {order.taskInstructions.length > 0 && (
            <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
              {order.taskInstructions.map((inst, idx) => (
                <li key={idx}>{trText(inst)}</li>
              ))}
            </ul>
          )}

          {client && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {client.clientName}
              </span>
              {(client.mobile || client.phone) && (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href={`tel:${client.mobile || client.phone}`}
                    className="inline-flex items-center gap-1 font-mono hover:text-primary tabular-nums"
                  >
                    <Phone className="w-3 h-3" />
                    {client.mobile || client.phone}
                  </a>
                </>
              )}
              {client.estimatedCostEur !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                    ca. {client.estimatedCostEur} €
                  </span>
                </>
              )}
              {client.officeInternalNotes && (
                <p className="w-full text-[11px] text-slate-500 mt-0.5">
                  {trText(client.officeInternalNotes)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: Quick Mechanic & Bay Assignment Box */}
        <div className="lg:w-96 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {w.selectMechanicsHint}
            </span>
            <button
              type="button"
              onClick={onOpenMechanicsManager}
              className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-3 h-3" />
              <span>{w.manageMechanicsBtn}</span>
            </button>
          </div>

          <Select
            value={selectedUnit}
            onValueChange={(v) => v && setSelectedUnit(v)}
          >
            <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 w-full">
              <SelectValue>{localizeUnitName(selectedUnit, language)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {WORKSHOP_UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {localizeUnitName(u, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-wrap gap-1.5">
            {mechanics.map((m) => {
              const active = selectedIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMechanic(m.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold min-h-[36px] transition-colors whitespace-nowrap",
                    active
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700"
                  )}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title={w.openWorkshopCardTitle}
                onClick={() => onOpenOrder(order.id)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title={w.clientApprovalShortBtn}
                onClick={() => onOpenApproval(order)}
              >
                <Phone className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title={w.printPdfBtn}
                onClick={() => onOpenPrint(order)}
              >
                <Printer className="w-4 h-4" />
              </Button>
              {canManage("workshop.delete") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-rose-500 hover:text-rose-700"
                  title={w.deleteOrderTitle}
                  onClick={() => onDeleteOrder(order.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <Button
              type="button"
              size="sm"
              disabled={selectedIds.length === 0}
              onClick={handleAssignSubmit}
              className="font-semibold gap-1.5 whitespace-nowrap shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{w.assignNowBtn}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkshopModule({ initialOrderId }: { initialOrderId?: string }) {
  const {
    workshopOrders,
    workshopClientDetailsMap,
    workshopNotifications,
    unreadWorkshopNotificationsCount,
    markWorkshopNotificationRead,
    markAllWorkshopNotificationsRead,
    assignWorkshopOrder,
    submitClientApprovalDecision,
    deleteWorkshopOrder,
    profiles,
    currentUser,
    currentUserId,
    canManage,
    isMechanic,
    isOffice,
    language,
    trText,
    isTranslatingDescriptions,
  } = useApp();

  const t = translations[language as keyof typeof translations] || translations.pl;
  const w = getWorkshopI18n(language);
  const mechanics = profiles.filter((p) => p.role === "mechanic");

  // Portal mode: Mechanics are strictly locked to "mechanic"; Office can switch between Office Dispatcher & Mechanic RODO Preview
  const [officePreviewMode, setOfficePreviewMode] = useState<
    "office" | "mechanic_preview"
  >("office");
  const effectiveMechanicView =
    isMechanic || officePreviewMode === "mechanic_preview";

  // Selected Mechanic filter when Office previews Mechanic View
  const [previewMechanicId, setPreviewMechanicId] = useState<string>(
    mechanics[0]?.id || "m_andy"
  );
  const activeMechanicFilterId = isMechanic
    ? currentUserId || ""
    : previewMechanicId;
  const activeMechanicProfile =
    mechanics.find((m) => m.id === activeMechanicFilterId) || currentUser;

  // Navigation to detailed task view
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialOrderId || null
  );

  // Filters & Tabs
  // Default Office tab is the Active Orders Board ("board") + separate "unassigned" tab + "all_table" + "completed"
  const [searchQuery, setSearchQuery] = useState("");
  const [officeTab, setOfficeTab] = useState<
    "board" | "unassigned" | "all_table" | "completed"
  >("board");
  const [mechanicTab, setMechanicTab] = useState<
    "active" | "all_shop" | "unassigned" | "history"
  >("active");

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMechanicsOpen, setIsMechanicsOpen] = useState(false);
  const [approvalOrder, setApprovalOrder] = useState<WorkshopOrder | null>(null);
  const [transferOrder, setTransferOrder] = useState<WorkshopOrder | null>(null);
  const [printOrder, setPrintOrder] = useState<WorkshopOrder | null>(null);

  const selectedOrder = selectedOrderId
    ? workshopOrders.find((o) => o.id === selectedOrderId) || null
    : null;

  // Partition orders cleanly
  const unassignedOrders = workshopOrders.filter(
    (o) =>
      isOrderUnassigned(o) &&
      o.status !== "completed" &&
      o.status !== "rejected"
  );

  const activeAssignedOrders = workshopOrders.filter(
    (o) =>
      !isOrderUnassigned(o) &&
      o.status !== "completed" &&
      o.status !== "rejected"
  );

  const completedOrders = workshopOrders.filter(
    (o) => o.status === "completed" || o.status === "rejected"
  );

  const waitingApprovalCount = activeAssignedOrders.filter(
    (o) => o.status === "report_sent" || o.status === "waiting_client"
  ).length;

  const approvedInWorkCount = activeAssignedOrders.filter(
    (o) => o.status === "approved"
  ).length;

  // Search helper matching both original & translated strings
  const matchesSearch = (o: WorkshopOrder, includeClientPii: boolean) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const clientInfo = includeClientPii ? workshopClientDetailsMap[o.id] : undefined;
    const summaryLocalized = formatOrderAssetSummary(o, language, trText).toLowerCase();
    const descLocalized = (
      o.assetCategory === "equipment"
        ? trText(o.equipmentDescription)
        : trText(o.vehicleSubtype)
    ).toLowerCase();

    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.plate || "").toLowerCase().includes(q) ||
      (o.machineNumber || "").toLowerCase().includes(q) ||
      summaryLocalized.includes(q) ||
      descLocalized.includes(q) ||
      localizeUnitName(o.unitName, language).toLowerCase().includes(q) ||
      (clientInfo?.clientName || "").toLowerCase().includes(q)
    );
  };

  const filteredActiveBoardOrders = activeAssignedOrders.filter((o) =>
    matchesSearch(o, true)
  );
  const filteredUnassignedOrders = unassignedOrders.filter((o) =>
    matchesSearch(o, true)
  );
  const filteredTableOrders = (
    officeTab === "completed" ? completedOrders : workshopOrders
  ).filter((o) => matchesSearch(o, true));

  // Board columns for Active Assigned Orders
  const boardColumns: Array<{
    id: string;
    title: string;
    orders: WorkshopOrder[];
  }> = [
    {
      id: "new",
      title: w.colStageNew,
      orders: filteredActiveBoardOrders.filter((o) => o.status === "new"),
    },
    {
      id: "in_progress",
      title: w.colStageInProgress,
      orders: filteredActiveBoardOrders.filter((o) => o.status === "in_progress"),
    },
    {
      id: "waiting_approval",
      title: w.colStageWaitingApproval,
      orders: filteredActiveBoardOrders.filter(
        (o) => o.status === "report_sent" || o.status === "waiting_client"
      ),
    },
    {
      id: "approved",
      title: w.colStageApproved,
      orders: filteredActiveBoardOrders.filter((o) => o.status === "approved"),
    },
  ];

  // Filtered orders for Mechanic Portal (Strictly Zero Customer PII)
  const mechanicActiveOrders = activeAssignedOrders.filter((o) =>
    o.assignedMechanicIds.includes(activeMechanicFilterId)
  );
  const mechanicHistoryOrders = completedOrders.filter((o) =>
    o.assignedMechanicIds.includes(activeMechanicFilterId)
  );

  const displayedMechanicOrders =
    mechanicTab === "active"
      ? mechanicActiveOrders
      : mechanicTab === "unassigned"
      ? unassignedOrders
      : mechanicTab === "history"
      ? mechanicHistoryOrders
      : activeAssignedOrders;

  if (selectedOrder) {
    return (
      <MechanicTaskView
        order={selectedOrder}
        onBack={() => setSelectedOrderId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Workshop Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t.workshopTitle}
            </h2>
            {effectiveMechanicView && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{t.rodoAnonymizedBadge}</span>
              </span>
            )}
            {isTranslatingDescriptions && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{w.translatingLiveBadge}</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {effectiveMechanicView ? w.mechanicMobileSubtitle : t.workshopSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Office Mode Switcher (Dispatcher vs RODO Mechanic View Preview) */}
          {isOffice && (
            <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setOfficePreviewMode("office")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
                  officePreviewMode === "office"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                {t.officeDispatcherPortal}
              </button>
              <button
                type="button"
                onClick={() => setOfficePreviewMode("mechanic_preview")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
                  officePreviewMode === "mechanic_preview"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                {w.mechanicPreviewBtn}
              </button>
            </div>
          )}

          {/* Mechanics Management Menu Button (Office / Admin) */}
          {isOffice && !effectiveMechanicView && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMechanicsOpen(true)}
              className="min-h-[40px] px-3 gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              <Users className="w-4 h-4" />
              <span>
                {w.manageMechanicsBtn} ({mechanics.length})
              </span>
            </Button>
          )}

          {/* Real-Time Workshop Notification Bell */}
          <Popover>
            <PopoverTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "relative min-h-[40px] px-3 gap-1.5 whitespace-nowrap shrink-0",
                isOffice &&
                  !effectiveMechanicView &&
                  waitingApprovalCount > 0 &&
                  "border-red-400 bg-red-50/90 text-red-800 hover:bg-red-100 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200"
              )}
            >
              <Bell className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">
                {w.notificationsBtn}
              </span>
              {unreadWorkshopNotificationsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold tabular-nums">
                  {unreadWorkshopNotificationsCount}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[350px] sm:w-[440px] p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="text-xs font-bold">{w.notificationsTitle}</span>
                {unreadWorkshopNotificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllWorkshopNotificationsRead}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 whitespace-nowrap"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    {w.markAllRead}
                  </button>
                )}
              </div>
              <div className="max-h-[420px] overflow-y-auto divide-y">
                {workshopNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    {w.noNotifications}
                  </div>
                ) : (
                  workshopNotifications.slice(0, 15).map((n) => {
                    const isUnread =
                      currentUserId && !n.readByUserIds.includes(currentUserId);
                    const linkedOrder = workshopOrders.find(
                      (o) => o.id === n.orderId
                    );
                    const isDefectAlert = n.type === "defect_report_submitted";
                    const isAwaitingDecision =
                      Boolean(linkedOrder) &&
                      (linkedOrder?.status === "report_sent" ||
                        linkedOrder?.status === "waiting_client");

                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          markWorkshopNotificationRead(n.id);
                          if (isOffice && isDefectAlert && linkedOrder && isAwaitingDecision) {
                            setApprovalOrder(linkedOrder);
                          } else {
                            setSelectedOrderId(n.orderId);
                          }
                        }}
                        className={cn(
                          "w-full text-left p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors space-y-2 cursor-pointer",
                          isUnread ? "bg-blue-50/40 dark:bg-blue-950/20" : "",
                          isOffice && isDefectAlert && isAwaitingDecision
                            ? "border-l-4 border-l-red-600 bg-red-50/40 dark:bg-red-950/20"
                            : ""
                        )}
                      >
                        <div className="space-y-1">
                          {isOffice && isDefectAlert && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-extrabold tracking-wide uppercase">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{w.notifyCustomerUrgentBadge}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {trText(n.title)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 tabular-nums shrink-0">
                              {format(parseISO(n.createdAt), "dd.MM HH:mm")}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {trText(n.assetLabel)}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {trText(n.message)}
                          </p>
                        </div>

                        {/* Office Direct Actions: Inform client & pass Yes/No back to mechanic */}
                        {isOffice && isDefectAlert && linkedOrder && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2"
                          >
                            {isAwaitingDecision ? (
                              <>
                                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                  {w.notifyCustomerActionHint}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      submitClientApprovalDecision(
                                        linkedOrder.id,
                                        "approved"
                                      );
                                      markWorkshopNotificationRead(n.id);
                                      toast.success(w.approvedDecisionToast);
                                    }}
                                    className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>{w.passApprovalToMechanicBtn}</span>
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      submitClientApprovalDecision(
                                        linkedOrder.id,
                                        "rejected"
                                      );
                                      markWorkshopNotificationRead(n.id);
                                      toast.success(w.rejectedDecisionToast);
                                    }}
                                    className="h-7 px-2.5 text-[11px] font-bold gap-1"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>{w.passRejectionToMechanicBtn}</span>
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      markWorkshopNotificationRead(n.id);
                                      setApprovalOrder(linkedOrder);
                                    }}
                                    className="h-7 px-2.5 text-[11px] font-semibold gap-1"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>{w.callClientDetailsBtn}</span>
                                  </Button>
                                </div>
                              </>
                            ) : linkedOrder.status === "approved" ||
                              linkedOrder.status === "completed" ? (
                              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                ✓ {w.decisionSentApprovedLabel}
                              </div>
                            ) : linkedOrder.status === "rejected" ? (
                              <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                                ✕ {w.decisionSentRejectedLabel}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Primary Office Action: Scan / Create New Auftrag */}
          {isOffice && !effectiveMechanicView && (
            <Button
              onClick={() => setIsScannerOpen(true)}
              className="min-h-[40px] font-semibold gap-2 whitespace-nowrap shrink-0"
            >
              <ScanLine className="w-4 h-4" />
              <span>{t.newWorkOrderBtn}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MECHANIC PORTAL VIEW (Mobile-First Touch Cards + Unassigned + History) */}
      {/* ===================================================================== */}
      {effectiveMechanicView ? (
        <div className="space-y-5">
          {!isMechanic && mechanics.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {w.previewMechanicDbLabel}
              </span>
              {mechanics.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPreviewMechanicId(m.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap",
                    previewMechanicId === m.id
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  )}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setMechanicTab("active")}
              className={cn(
                "min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap",
                mechanicTab === "active"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              {w.myActiveTab} ({mechanicActiveOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setMechanicTab("all_shop")}
              className={cn(
                "min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap",
                mechanicTab === "all_shop"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              {w.tabActiveBoard} ({activeAssignedOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setMechanicTab("unassigned")}
              className={cn(
                "min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap",
                mechanicTab === "unassigned"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              {w.tabUnassigned} ({unassignedOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setMechanicTab("history")}
              className={cn(
                "min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap",
                mechanicTab === "history"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              {w.historyTab} ({mechanicHistoryOrders.length})
            </button>
          </div>

          {displayedMechanicOrders.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
              <Wrench className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {mechanicTab === "unassigned"
                  ? w.emptyUnassignedTitle
                  : w.emptyTabTitle}
              </div>
              <p className="text-xs text-slate-500">
                {mechanicTab === "unassigned"
                  ? w.emptyUnassignedDesc
                  : w.emptyTabDesc}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedMechanicOrders.map((order) => {
                const unassigned = isOrderUnassigned(order);
                const teamNames = order.assignedMechanicIds.map(
                  (id) => mechanics.find((m) => m.id === id)?.name || id
                );
                const totalMins = order.timeLogs.reduce(
                  (s, l) => s + (l.durationMinutes || 0),
                  0
                );

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 hover:border-slate-400 dark:hover:border-slate-600 transition-colors flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      {(order.status === "report_sent" ||
                        order.status === "waiting_client") && (
                        <div className="rounded-lg bg-red-600 text-white px-3 py-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide shadow-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{w.waitingApprovalCardBadge}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 tabular-nums">
                          <span>{order.orderNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span>{localizeUnitName(order.unitName, language)}</span>
                        </div>
                        <StatusPill
                          status={unassigned ? "unassigned" : order.status}
                          lang={language}
                        />
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {order.assetCategory === "equipment" ? (
                            <Cog className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                          ) : (
                            <Truck className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                            {order.assetCategory === "equipment"
                              ? `${order.machineNumber ? `#${order.machineNumber} · ` : ""}${
                                  order.equipmentName
                                    ? trText(order.equipmentName)
                                    : w.equipmentFallback
                                }`
                              : `${order.plate || w.noPlateFallback} · ${
                                  order.vehicleType
                                    ? localizeVehicleType(order.vehicleType, language)
                                    : w.trailerFallback
                                }`}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {order.assetCategory === "equipment"
                              ? trText(order.equipmentDescription)
                              : trText(order.vehicleSubtype)}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        <strong>{w.scopePrefix}</strong>{" "}
                        {order.scopeTypes
                          .map((s) => getScopeLabel(s, language))
                          .join(" · ")}
                      </div>

                      {order.taskInstructions[0] && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          • {trText(order.taskInstructions[0])}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Users className="w-3.5 h-3.5" />
                          {unassigned
                            ? w.unassignedStatusLabel
                            : teamNames.join(", ")}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <Clock className="w-3.5 h-3.5" />
                          {formatMinutesAsHours(totalMins)}
                        </span>
                      </div>

                      {unassigned && activeMechanicFilterId ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            assignWorkshopOrder(
                              order.id,
                              [activeMechanicFilterId],
                              activeMechanicProfile?.unitName
                            );
                            toast.success(w.orderClaimedToast(order.orderNumber));
                          }}
                          className="h-8 text-xs font-semibold whitespace-nowrap shrink-0"
                        >
                          {w.takeOrderSelfBtn}
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform whitespace-nowrap">
                          {w.openProtocolBtn}
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ===================================================================== */
        /* OFFICE DISPATCHER PORTAL VIEW (Board + Unassigned Tab + Table)        */
        /* ===================================================================== */
        <div className="space-y-6">
          {/* 5 Operational KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => setOfficeTab("board")}
              className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
            >
              <div className="text-xs text-slate-500">{w.kpiActiveOrders}</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                {activeAssignedOrders.length}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOfficeTab("unassigned")}
              className="text-left rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 p-4 hover:border-amber-500 transition-colors"
            >
              <div className="text-xs text-amber-900 dark:text-amber-300">
                {w.kpiUnassignedOrders}
              </div>
              <div className="text-2xl font-bold text-amber-950 dark:text-amber-200 font-mono tabular-nums mt-1">
                {unassignedOrders.length}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOfficeTab("board")}
              className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
            >
              <div className="text-xs text-slate-500">{w.kpiWaitingClient}</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                {waitingApprovalCount}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOfficeTab("board")}
              className="text-left rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 hover:border-emerald-400 transition-colors"
            >
              <div className="text-xs text-emerald-800 dark:text-emerald-300">
                {w.kpiApprovedInWork}
              </div>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 font-mono tabular-nums mt-1">
                {approvedInWorkCount}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOfficeTab("completed")}
              className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-slate-400 dark:hover:border-slate-600 transition-colors col-span-2 md:col-span-1"
            >
              <div className="text-xs text-slate-500">{w.kpiCompletedProtocols}</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                {completedOrders.length}
              </div>
            </button>
          </div>

          {/* Primary Office Tabs & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setOfficeTab("board")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
                  officeTab === "board"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>
                  {w.tabActiveBoard} ({activeAssignedOrders.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOfficeTab("unassigned")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
                  officeTab === "unassigned"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>
                  {w.tabUnassigned} ({unassignedOrders.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOfficeTab("all_table")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
                  officeTab === "all_table"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                <List className="w-3.5 h-3.5" />
                <span>
                  {w.tabAllTable} ({workshopOrders.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOfficeTab("completed")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
                  officeTab === "completed"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                <span>
                  {w.tabCompleted} ({completedOrders.length})
                </span>
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={w.searchPlaceholder}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* =============================================================== */}
          {/* TAB 1: ACTIVE ORDERS BOARD (4 STAGE COLUMNS)                    */}
          {/* =============================================================== */}
          {officeTab === "board" && (
            <>
              {filteredActiveBoardOrders.length === 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-3">
                  <LayoutGrid className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {w.emptyActiveBoardTitle}
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {w.emptyActiveBoardDesc}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {unassignedOrders.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setOfficeTab("unassigned")}
                        className="whitespace-nowrap"
                      >
                        {w.tabUnassigned} ({unassignedOrders.length})
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsScannerOpen(true)}
                      className="whitespace-nowrap"
                    >
                      {t.newWorkOrderBtn}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                  {boardColumns.map((col) => (
                    <div
                      key={col.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 px-1 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {col.title}
                        </h3>
                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 tabular-nums shrink-0">
                          {col.orders.length}
                        </span>
                      </div>

                      {col.orders.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          {w.emptyStageCol}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {col.orders.map((order) => {
                            const client = workshopClientDetailsMap[order.id];
                            const teamNames = order.assignedMechanicIds.map(
                              (id) =>
                                mechanics.find((m) => m.id === id)?.name || id
                            );
                            const totalMins = order.timeLogs.reduce(
                              (s, l) => s + (l.durationMinutes || 0),
                              0
                            );
                            const techDesc =
                              order.assetCategory === "equipment"
                                ? trText(order.equipmentDescription)
                                : trText(order.vehicleSubtype);

                            return (
                              <div
                                key={order.id}
                                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2.5 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500 tabular-nums">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {order.orderNumber}
                                  </span>
                                  <span className="truncate">
                                    {localizeUnitName(order.unitName, language)}
                                  </span>
                                </div>

                                <div
                                  onClick={() => setSelectedOrderId(order.id)}
                                  className="cursor-pointer space-y-1"
                                >
                                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                                    {formatOrderAssetSummary(
                                      order,
                                      language,
                                      trText
                                    )}
                                  </div>
                                  {techDesc && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                      {techDesc}
                                    </p>
                                  )}
                                </div>

                                <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                  {order.scopeTypes
                                    .map((s) => getScopeLabel(s, language))
                                    .join(" · ")}
                                </div>

                                {order.defectReport &&
                                  order.defectReport.defects[0] && (
                                    <p className="text-[11px] text-amber-800 dark:text-amber-300 line-clamp-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                      • {trText(order.defectReport.defects[0])}
                                    </p>
                                  )}

                                {client && (
                                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                      {client.clientName}
                                    </span>
                                    {client.estimatedCostEur !== undefined && (
                                      <span className="font-mono tabular-nums shrink-0">
                                        {client.estimatedCostEur} €
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 truncate">
                                      <Users className="w-3 h-3 shrink-0" />
                                      <span className="truncate">
                                        {teamNames.join(", ")}
                                      </span>
                                    </span>
                                    <span className="font-mono tabular-nums shrink-0">
                                      {formatMinutesAsHours(totalMins)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <Button
                                      variant={
                                        order.status === "report_sent"
                                          ? "default"
                                          : "ghost"
                                      }
                                      size="sm"
                                      onClick={() => setApprovalOrder(order)}
                                      className="h-7 px-2 text-[11px] font-semibold whitespace-nowrap"
                                    >
                                      {w.clientApprovalShortBtn}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      title={w.openWorkshopCardTitle}
                                      onClick={() => setSelectedOrderId(order.id)}
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      title={t.transferOrderBtn}
                                      onClick={() => setTransferOrder(order)}
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* =============================================================== */}
          {/* TAB 2: SEPARATE UNASSIGNED ORDERS QUEUE                         */}
          {/* =============================================================== */}
          {officeTab === "unassigned" && (
            <div className="space-y-4">
              {filteredUnassignedOrders.length === 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-3">
                  <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {w.emptyUnassignedTitle}
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {w.emptyUnassignedDesc}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsScannerOpen(true)}
                    className="whitespace-nowrap"
                  >
                    {t.newWorkOrderBtn}
                  </Button>
                </div>
              ) : (
                filteredUnassignedOrders.map((order) => (
                  <UnassignedOrderCard
                    key={order.id}
                    order={order}
                    client={workshopClientDetailsMap[order.id]}
                    mechanics={mechanics}
                    language={language}
                    w={w}
                    trText={trText}
                    canManage={canManage}
                    onAssign={assignWorkshopOrder}
                    onOpenOrder={setSelectedOrderId}
                    onOpenApproval={setApprovalOrder}
                    onOpenPrint={setPrintOrder}
                    onDeleteOrder={deleteWorkshopOrder}
                    onOpenMechanicsManager={() => setIsMechanicsOpen(true)}
                  />
                ))
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3 & 4: ALL ORDERS TABLE / COMPLETED ARCHIVE                 */}
          {/* =============================================================== */}
          {(officeTab === "all_table" || officeTab === "completed") && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">
                      {w.colOrderAsset}
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      {w.colClientOfficeOnly}
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      {w.colScopeTeam}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      {w.colTimeCost}
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      {w.colStatus}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      {w.colActions}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTableOrders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-28 text-center text-xs text-slate-500"
                      >
                        {w.emptySearchOrders}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTableOrders.map((order) => {
                      const client = workshopClientDetailsMap[order.id];
                      const unassigned = isOrderUnassigned(order);
                      const teamNames = order.assignedMechanicIds.map(
                        (id) => mechanics.find((m) => m.id === id)?.name || id
                      );
                      const totalMins = order.timeLogs.reduce(
                        (s, l) => s + (l.durationMinutes || 0),
                        0
                      );
                      const techDesc =
                        order.assetCategory === "equipment"
                          ? trText(order.equipmentDescription)
                          : trText(order.vehicleSubtype);

                      return (
                        <TableRow
                          key={order.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                        >
                          <TableCell className="py-3.5">
                            <div className="font-mono text-xs text-slate-500 tabular-nums">
                              {order.orderNumber} ·{" "}
                              {format(parseISO(order.createdAt), "dd.MM.yyyy")}
                            </div>
                            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                              {formatOrderAssetSummary(order, language, trText)}
                            </div>
                            {techDesc && (
                              <div className="text-xs text-slate-500 line-clamp-1">
                                {techDesc}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400">
                              {localizeUnitName(order.unitName, language)}
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5">
                            {client ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                  {client.clientName}
                                </div>
                                {(client.mobile || client.phone) && (
                                  <a
                                    href={`tel:${client.mobile || client.phone}`}
                                    className="inline-flex items-center gap-1 text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-primary tabular-nums"
                                  >
                                    <Phone className="w-3 h-3" />
                                    {client.mobile || client.phone}
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </TableCell>

                          <TableCell className="py-3.5">
                            <div className="text-xs text-slate-700 dark:text-slate-300">
                              {order.scopeTypes
                                .map((s) => getScopeLabel(s, language))
                                .join(" · ")}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              <span>
                                {w.teamPrefix}:{" "}
                                {unassigned
                                  ? w.unassignedStatusLabel
                                  : teamNames.join(", ")}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5 text-right font-mono tabular-nums">
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {formatMinutesAsHours(totalMins)}
                            </div>
                            {client?.estimatedCostEur !== undefined && (
                              <div className="text-xs text-slate-500">
                                {client.estimatedCostEur} €
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="py-3.5">
                            <StatusPill
                              status={unassigned ? "unassigned" : order.status}
                              lang={language}
                            />
                          </TableCell>

                          <TableCell className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {unassigned ? (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => setOfficeTab("unassigned")}
                                  className="h-8 text-xs font-semibold whitespace-nowrap"
                                >
                                  {w.assignNowBtn}
                                </Button>
                              ) : (
                                <Button
                                  variant={
                                    order.status === "report_sent"
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setApprovalOrder(order)}
                                  className="h-8 text-xs font-semibold whitespace-nowrap"
                                >
                                  {w.clientApprovalShortBtn}
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={w.openWorkshopCardTitle}
                                onClick={() => setSelectedOrderId(order.id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={t.transferOrderBtn}
                                onClick={() => setTransferOrder(order)}
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={t.printProtocolBtn}
                                onClick={() => setPrintOrder(order)}
                              >
                                <Printer className="w-4 h-4" />
                              </Button>

                              {canManage("workshop.delete") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-rose-500 hover:text-rose-700"
                                  title={w.deleteOrderTitle}
                                  onClick={() => deleteWorkshopOrder(order.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <WorkOrderScannerModal
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
      />

      <MechanicsManagerDialog
        open={isMechanicsOpen}
        onOpenChange={setIsMechanicsOpen}
      />

      <ClientApprovalDialog
        order={approvalOrder}
        open={Boolean(approvalOrder)}
        onOpenChange={(v) => !v && setApprovalOrder(null)}
      />

      <TransferOrderDialog
        order={transferOrder}
        open={Boolean(transferOrder)}
        onOpenChange={(v) => !v && setTransferOrder(null)}
      />

      <PrintableWorkshopProtocol
        order={printOrder}
        clientDetails={
          printOrder ? workshopClientDetailsMap[printOrder.id] : undefined
        }
        mechanics={mechanics}
        isOffice={isOffice}
        lang={language}
        open={Boolean(printOrder)}
        onOpenChange={(v) => !v && setPrintOrder(null)}
      />
    </div>
  );
}
