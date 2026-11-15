"use client";

import React from "react";
import { Truck, Cog, ShieldCheck, Hash } from "lucide-react";
import {
  WorkshopOrder,
  WorkshopOrderStatus,
  WorkshopScopeType,
} from "@/lib/workshop-types";
import { getWorkshopI18n } from "@/lib/workshop-i18n";
import { localizeVehicleType } from "@/lib/workshop-text-localizer";
import { useApp } from "@/lib/context";
import { cn } from "@/lib/utils";

const SCOPE_LABELS: Record<
  WorkshopScopeType,
  { pl: string; de: string; en: string }
> = {
  TUV: { pl: "TÜV (Przegląd główny)", de: "TÜV-Hauptuntersuchung", en: "TÜV Inspection" },
  Nachprufung: { pl: "TÜV-Nachprüfung", de: "TÜV-Nachprüfung", en: "TÜV Re-inspection" },
  Gasprufung: { pl: "Gasprüfung", de: "Gasprüfung", en: "Gas Check" },
  Kundendienst: { pl: "Kundendienst (Serwis)", de: "Kundendienst", en: "Service Check" },
  UVV: { pl: "UVV (Badanie BHP maszyn)", de: "UVV-Prüfung", en: "UVV Safety Check" },
  wheels: { pl: "Wymiana / dokręcenie kół", de: "Radwechsel / Räder nachziehen", en: "Wheels & Torque" },
  electrics: { pl: "Elektryka / Oświetlenie", de: "Elektrik / Beleuchtung", en: "Electrics & Wiring" },
  brakes: { pl: "Układ hamulcowy / Linki", de: "Bremsanlage / Bremsseile", en: "Brakes & Cables" },
  other: { pl: "Inne prace naprawcze", de: "Sonstige Arbeiten", en: "Other Repairs" },
};

export function getScopeLabel(scope: WorkshopScopeType, lang: string = "pl"): string {
  const entry = SCOPE_LABELS[scope] || SCOPE_LABELS.other;
  if (lang === "de") return entry.de;
  if (lang === "en") return entry.en;
  return entry.pl;
}

export function formatMinutesAsHours(minutes: number): string {
  if (!minutes || minutes <= 0) return "0 min";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} h`;
  return `${hrs} h ${mins} min`;
}

export function StatusPill({
  status,
  lang = "pl",
}: {
  status: WorkshopOrderStatus;
  lang?: string;
}) {
  const map: Record<
    WorkshopOrderStatus,
    { label: string; text: string; bg: string }
  > = {
    unassigned: {
      label:
        lang === "de"
          ? "Nicht zugewiesen"
          : lang === "en"
          ? "Unassigned"
          : "Nieprzydzielone",
      text: "text-amber-900 dark:text-amber-300",
      bg: "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800",
    },
    new: {
      label: lang === "de" ? "Neu zugewiesen" : lang === "en" ? "Assigned" : "Nowe zlecenie",
      text: "text-blue-800 dark:text-blue-300",
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    },
    in_progress: {
      label: lang === "de" ? "In Arbeit" : lang === "en" ? "In Progress" : "W realizacji",
      text: "text-indigo-800 dark:text-indigo-300",
      bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
    },
    report_sent: {
      label:
        lang === "de"
          ? "Mängelbericht im Büro"
          : lang === "en"
          ? "Report Sent to Office"
          : "Raport usterek w biurze",
      text: "text-amber-900 dark:text-amber-300",
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    },
    waiting_client: {
      label:
        lang === "de"
          ? "Warten auf Kunden"
          : lang === "en"
          ? "Awaiting Client"
          : "Czeka na zgodę klienta",
      text: "text-orange-900 dark:text-orange-300",
      bg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
    },
    approved: {
      label:
        lang === "de"
          ? "Freigegeben vom Kunden"
          : lang === "en"
          ? "Client Approved"
          : "Zatwierdzone — naprawiać",
      text: "text-emerald-900 dark:text-emerald-300",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    },
    rejected: {
      label:
        lang === "de"
          ? "Abgelehnt vom Kunden"
          : lang === "en"
          ? "Client Rejected"
          : "Odrzucone przez klienta",
      text: "text-rose-900 dark:text-rose-300",
      bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
    },
    completed: {
      label:
        lang === "de"
          ? "Abgeschlossen (Protokoll)"
          : lang === "en"
          ? "Completed"
          : "Ukończone (Protokół)",
      text: "text-slate-800 dark:text-slate-200",
      bg: "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700",
    },
  };

  const st = map[status] || map.new;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold whitespace-nowrap shrink-0",
        st.bg,
        st.text
      )}
    >
      <span>{st.label}</span>
    </span>
  );
}

/**
 * RODO-compliant Trailer Technical Card (Zero Customer PII)
 */
export function TrailerInfoCard({
  order,
  showRodoNotice = true,
  lang = "pl",
}: {
  order: WorkshopOrder;
  showRodoNotice?: boolean;
  lang?: string;
}) {
  const { trText } = useApp();
  const w = getWorkshopI18n(lang);
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6 text-slate-700 dark:text-slate-200" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">
              {w.trailerCardHeader} · {order.orderNumber}
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {order.plate || w.noPlateFallback}
            </div>
          </div>
        </div>
        {showRodoNotice && (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{w.rodoHiddenNotice}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block">{w.trailerTypeLabel}</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {order.vehicleType ? localizeVehicleType(order.vehicleType, lang) : "—"}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">{w.trailerSpecLabel}</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {order.vehicleSubtype ? trText(order.vehicleSubtype) : "Standard"}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">{w.trailerVinLabel}</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {order.vin || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * RODO-compliant Construction Equipment Card (Zero Customer PII)
 */
export function EquipmentInfoCard({
  order,
  showRodoNotice = true,
  lang = "pl",
}: {
  order: WorkshopOrder;
  showRodoNotice?: boolean;
  lang?: string;
}) {
  const { trText } = useApp();
  const w = getWorkshopI18n(lang);
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
            <Cog className="w-6 h-6 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">
              {w.equipmentCardHeader} · {order.orderNumber}
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {order.equipmentName ? trText(order.equipmentName) : w.equipmentFallback}
            </div>
          </div>
        </div>
        {showRodoNotice && (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{w.rodoHiddenNotice}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block">{w.machineNumberLabel}</span>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1 tabular-nums">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            {order.machineNumber || w.noMachineNumber}
          </span>
        </div>
        <div className="sm:col-span-2">
          <span className="text-slate-500 block">{w.equipmentTechDescLabel}</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {order.equipmentDescription ? trText(order.equipmentDescription) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
