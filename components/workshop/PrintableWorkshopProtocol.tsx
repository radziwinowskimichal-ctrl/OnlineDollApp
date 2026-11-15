"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {
  WorkshopOrder,
  WorkshopOrderClientDetails,
  formatOrderAssetSummary,
} from "@/lib/workshop-types";
import { UserProfile } from "@/lib/store";
import { useApp } from "@/lib/context";
import { getWorkshopI18n } from "@/lib/workshop-i18n";
import {
  localizeUnitName,
  localizePartUnit,
} from "@/lib/workshop-text-localizer";
import { formatMinutesAsHours, getScopeLabel } from "./AssetInfoCards";
import { format, parseISO } from "date-fns";

/**
 * Iframe-safe 1-page A4 PDF print helper (no window.open popup blocking in iframes)
 */
function printHtmlElementInIframe(elementId: string, docTitle: string) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const styles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  )
    .map((node) => {
      if (node.tagName.toLowerCase() === "link") {
        const href = node.getAttribute("href");
        if (href) {
          const abs = new URL(href, window.location.origin).href;
          return `<link rel="stylesheet" href="${abs}">`;
        }
      }
      return node.outerHTML;
    })
    .join("\n");

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${docTitle}</title>
    <base href="${window.location.origin}" />
    ${styles}
    <style>
      @page {
        size: A4 portrait;
        margin: 0;
      }
      html, body {
        width: 210mm !important;
        height: 296mm !important;
        max-height: 296mm !important;
        background: #ffffff !important;
        color: #0f172a !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      #printable-workshop-protocol-sheet {
        width: 210mm !important;
        height: 296mm !important;
        max-height: 296mm !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        overflow: hidden !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    ${el.outerHTML}
  </body>
</html>`);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  }, 450);
}

interface PrintableWorkshopProtocolProps {
  order: WorkshopOrder | null;
  clientDetails?: WorkshopOrderClientDetails;
  mechanics: UserProfile[];
  isOffice: boolean;
  lang: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WEEKDAY_KEYS = ["MO", "DI", "MI", "DO", "FR"] as const;

function formatHoursCompact(mins: number): string {
  if (!mins || mins <= 0) return "";
  const hrs = mins / 60;
  return Number.isInteger(hrs) ? String(hrs) : hrs.toFixed(1);
}

export function PrintableWorkshopProtocol({
  order,
  clientDetails,
  mechanics,
  isOffice,
  lang,
  open,
  onOpenChange,
}: PrintableWorkshopProtocolProps) {
  const { trText } = useApp();
  if (!order) return null;

  const w = getWorkshopI18n(lang);
  const scopeTypes = order.scopeTypes ?? [];
  const taskInstructions = order.taskInstructions ?? [];
  const timeLogs = order.timeLogs ?? [];
  const partsUsed = order.partsUsed ?? [];
  const assignedMechanicIds = order.assignedMechanicIds ?? [];

  const totalMinutes = timeLogs.reduce(
    (sum, l) => sum + (l.durationMinutes || 0),
    0
  );
  const assignedNames = assignedMechanicIds.map(
    (id) => mechanics.find((m) => m.id === id)?.name || id
  );

  // Scope flags mapped to the authentic Arbeitsauftrag right-hand table
  const hasTuv = scopeTypes.includes("TUV");
  const hasNachpruefung = scopeTypes.includes("Nachprufung");
  const hasGas = scopeTypes.includes("Gasprufung");
  const kundendienstExtras = scopeTypes.filter(
    (s) => s !== "TUV" && s !== "Nachprufung" && s !== "Gasprufung"
  );
  const kundendienstText = kundendienstExtras
    .map((s) => getScopeLabel(s, lang))
    .join(", ");

  // Kennzeichen / machine summary
  const assetIdentifier =
    order.assetCategory === "equipment"
      ? [
          order.machineNumber ? `#${order.machineNumber}` : "",
          order.equipmentName ? trText(order.equipmentName) : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : [order.plate || "—", order.vin ? `VIN: ${order.vin}` : ""]
          .filter(Boolean)
          .join(" · ");

  // Mängelanzeige lines (4 ruled lines)
  const defectEntries: string[] = [];
  if (order.defectReport?.defects && order.defectReport.defects.length > 0) {
    order.defectReport.defects.forEach((d) => defectEntries.push(trText(d)));
  }
  if (order.defectReport?.notes) {
    defectEntries.push(trText(order.defectReport.notes));
  }
  if (defectEntries.length === 0) {
    const desc =
      order.assetCategory === "equipment"
        ? order.equipmentDescription
        : order.vehicleSubtype;
    if (desc) {
      defectEntries.push(trText(desc));
    }
  }
  const maengelLines = Array.from({ length: 4 }, (_, i) => defectEntries[i] || "");

  // Arbeitsaufwand lines (5 rows x 2 columns = up to 10 items, matching paper layout)
  const workItems: string[] = [];
  taskInstructions.forEach((inst) => workItems.push(trText(inst)));
  timeLogs.forEach((log) => {
    if (log.note) {
      const text = `${log.mechanicName}: ${trText(log.note)}`;
      if (!workItems.includes(text)) workItems.push(text);
    }
  });
  if (workItems.length === 0 && scopeTypes.length > 0) {
    workItems.push(scopeTypes.map((s) => getScopeLabel(s, lang)).join(" · "));
  }
  const arbeitsRows = Array.from({ length: 5 }, (_, i) => ({
    left: workItems[i] || "",
    right: workItems[i + 5] || "",
  }));

  // Material lines (6 rows x 2 columns = up to 12 items, matching paper layout)
  const materialItems: string[] = [];
  partsUsed.forEach((p) => {
    const qty = `${p.quantity} ${localizePartUnit(p.unit, lang)}`;
    const code = p.code ? ` [${p.code}]` : "";
    materialItems.push(`${qty} ${trText(p.name)}${code}`.trim());
  });
  if (order.defectReport?.requiredParts) {
    order.defectReport.requiredParts.forEach((rp) => {
      const translated = trText(rp);
      if (!materialItems.includes(translated)) {
        materialItems.push(`(${w.requiredPartsOrderLabel.split(":")[0]}) ${translated}`);
      }
    });
  }
  const materialRows = Array.from({ length: 6 }, (_, i) => ({
    left: materialItems[i] || "",
    right: materialItems[i + 6] || "",
  }));

  // Monteur weekly grid (MO / DI / MI / DO / FR)
  const monteurMap = new Map<
    string,
    { name: string; days: Record<(typeof WEEKDAY_KEYS)[number], number> }
  >();
  assignedMechanicIds.forEach((id) => {
    const name = mechanics.find((m) => m.id === id)?.name || id;
    monteurMap.set(name, {
      name,
      days: { MO: 0, DI: 0, MI: 0, DO: 0, FR: 0 },
    });
  });
  timeLogs.forEach((log) => {
    const name = log.mechanicName || "Mechanik";
    if (!monteurMap.has(name)) {
      monteurMap.set(name, {
        name,
        days: { MO: 0, DI: 0, MI: 0, DO: 0, FR: 0 },
      });
    }
    const entry = monteurMap.get(name)!;
    let dayIdx = 0;
    try {
      const jsDay = parseISO(log.startedAt).getDay(); // 0=Sun..6=Sat
      dayIdx = jsDay >= 1 && jsDay <= 5 ? jsDay - 1 : 4; // Sat/Sun fold to FR
    } catch {
      dayIdx = 0;
    }
    const key = WEEKDAY_KEYS[dayIdx];
    entry.days[key] += log.durationMinutes || 0;
  });
  const monteurEntries = Array.from(monteurMap.values());
  const monteurRows = Array.from({ length: 4 }, (_, i) => monteurEntries[i] || null);

  // Client decision display (Office only)
  const clientDecisionShort =
    isOffice && clientDetails
      ? clientDetails.clientDecision === "approved"
        ? w.decisionApproved
        : clientDetails.clientDecision === "rejected"
        ? w.decisionRejected
        : w.decisionPending
      : "";

  const handlePrint = () => {
    printHtmlElementInIframe(
      "printable-workshop-protocol-sheet",
      `ARBEITSAUFTRAG-${order.orderNumber}`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="full"
        className="w-[96vw] sm:w-[95vw] sm:max-w-[96vw] h-[95dvh] max-h-[95dvh] bg-slate-200 dark:bg-slate-900"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center justify-between pr-8 text-slate-900 dark:text-slate-100">
            <span className="flex items-center gap-2 text-sm sm:text-base font-bold">
              <span>ARBEITSAUFTRAG · {order.orderNumber}</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-white/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                A4 · 1 {lang === "de" ? "Seite" : lang === "en" ? "Page" : "Strona"}
              </span>
            </span>
            <Button onClick={handlePrint} size="sm" className="gap-1.5">
              <Printer className="w-4 h-4" />
              <span>{w.printSavePdfBtn}</span>
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable A4 Canvas Preview */}
        <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-300/70 dark:bg-slate-950/60 p-2 sm:p-4">
          <div
            id="printable-workshop-protocol-sheet"
            className="w-[210mm] h-[296mm] mx-auto bg-white text-slate-950 shadow-xl px-[12mm] py-[9.5mm] flex flex-col justify-between text-[10.5px] leading-[1.25] font-sans select-text"
          >
            {/* ================= TOP SECTION: HEADER & METADATA ================= */}
            <div>
              {/* Company Header & DOLLCO Emblem */}
              <div className="flex items-start justify-between gap-4 pb-1.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-slate-900 leading-tight">
                    Doll Fahrzeugbau oHG / Raudtener Str. 8 / 90475 Nürnberg
                  </div>
                  <div className="text-[10.5px] text-slate-800 leading-tight mt-0.5">
                    Ust.-Id.-Nr. DE 228 243 158
                  </div>

                  <div className="mt-3 flex items-baseline justify-between border-b-[2px] border-slate-950 pb-0.5 mr-4">
                    <h1 className="text-[26px] font-black tracking-[0.04em] uppercase leading-none text-slate-950">
                      ARBEITSAUFTRAG
                    </h1>
                    <span className="font-mono text-[10px] font-bold text-slate-700">
                      Nr: {order.orderNumber}
                    </span>
                  </div>
                </div>

                {/* DOLLCO Geometric Red Logotype + Contact Block */}
                <div className="w-[54mm] shrink-0 flex flex-col items-end">
                  <div className="w-full flex items-center justify-center border-2 border-[#dc2626] rounded-[4px] py-1 px-2 bg-white">
                    <span
                      className="text-[22px] font-black tracking-[0.14em] leading-none text-[#dc2626] select-none"
                      style={{ fontStretch: "expanded" }}
                    >
                      DOLLCO
                    </span>
                  </div>
                  <div className="w-full text-center text-[9.5px] text-slate-800 leading-[1.25] mt-1">
                    <div>Tel.-Nr. 0911 / 83 05 04</div>
                    <div>Fax-Nr. 0911 / 83 23 64</div>
                    <div>email: dollco@gmx.de</div>
                    <div>web: www.dollco.de</div>
                  </div>
                </div>
              </div>

              {/* Upper 2-Column Form Table (Customer Info vs Order / Vehicle / Scope) */}
              <div className="grid grid-cols-2 gap-6 mt-2">
                {/* Left Column: Customer Info (RODO-protected for Mechanic) */}
                <div className="border-t border-slate-500">
                  {[
                    {
                      label: "Name:",
                      value: isOffice
                        ? clientDetails?.clientName || ""
                        : `RODO · ${w.rodoHiddenNotice.slice(0, 34)}`,
                      bold: isOffice,
                    },
                    {
                      label: "Straße:",
                      value: isOffice ? clientDetails?.street || "" : "",
                    },
                    {
                      label: "Ort:",
                      value: isOffice ? clientDetails?.city || "" : "",
                    },
                    {
                      label: "Tel/Fax-Nr.",
                      value: isOffice ? clientDetails?.phone || "" : "",
                    },
                    {
                      label: "Mobil:",
                      value: isOffice ? clientDetails?.mobile || "" : "",
                    },
                    {
                      label: "Email:",
                      value: isOffice ? clientDetails?.email || "" : "",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-end border-b border-slate-500 h-[6.2mm] pb-[1mm] gap-2"
                    >
                      <span className="w-[18mm] shrink-0 text-[10px] font-medium text-slate-900">
                        {row.label}
                      </span>
                      <span
                        className={`flex-1 truncate text-[10.5px] ${
                          row.bold ? "font-bold text-slate-950" : "text-slate-900"
                        }`}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right Column: Datum, Kennzeichen, TÜV, Nachprüfung, Gasprüfung, Kundendienst */}
                <div className="border-t border-slate-500">
                  {[
                    {
                      label: "Datum:",
                      value: `${format(parseISO(order.createdAt), "dd.MM.yyyy")} · ${localizeUnitName(
                        order.unitName,
                        lang
                      )}`,
                      mono: true,
                    },
                    {
                      label: "Kennzeichen:",
                      value: assetIdentifier,
                      bold: true,
                    },
                    {
                      label: "TÜV:",
                      value: hasTuv ? "✓  JA" : "",
                      bold: hasTuv,
                    },
                    {
                      label: "TÜV – Nachprüfung:",
                      value: hasNachpruefung ? "✓  JA" : "",
                      bold: hasNachpruefung,
                    },
                    {
                      label: "Gasprüfung:",
                      value: hasGas ? "✓  JA" : "",
                      bold: hasGas,
                    },
                    {
                      label: "Kundendienst:",
                      value: kundendienstText ? `✓  ${kundendienstText}` : "",
                      bold: Boolean(kundendienstText),
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-end border-b border-slate-500 h-[6.2mm] pb-[1mm] gap-2"
                    >
                      <span className="w-[31mm] shrink-0 text-[10px] font-medium text-slate-900">
                        {row.label}
                      </span>
                      <span
                        className={`flex-1 truncate text-[10.5px] ${
                          row.bold ? "font-bold text-slate-950" : "text-slate-900"
                        } ${row.mono ? "font-mono" : ""}`}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Middle-Upper Section: 5 Workshop Checkboxes + Kosten Kunden mitgeteilt Table */}
              <div className="grid grid-cols-12 gap-5 mt-3 items-start">
                {/* Left: 5 Authentic Checkboxes */}
                <div className="col-span-7 grid grid-cols-2 gap-x-4 gap-y-2 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium leading-tight">
                      Bewegliche Teile
                      <br />
                      abgeschmiert
                    </span>
                    <span className="w-[6.5mm] h-[6.5mm] border border-slate-800 flex items-center justify-center font-bold text-[12px] shrink-0">
                      {order.checklist?.beweglicheTeile ? "✓" : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium leading-tight">
                      Luftdruck geprüft
                    </span>
                    <span className="w-[6.5mm] h-[6.5mm] border border-slate-800 flex items-center justify-center font-bold text-[12px] shrink-0">
                      {order.checklist?.luftdruck ? "✓" : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium leading-tight">
                      Bremsen Kontrolle
                    </span>
                    <span className="w-[6.5mm] h-[6.5mm] border border-slate-800 flex items-center justify-center font-bold text-[12px] shrink-0">
                      {order.checklist?.bremsen ? "✓" : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium leading-tight">
                      Räder festgezogen
                    </span>
                    <span className="w-[6.5mm] h-[6.5mm] border border-slate-800 flex items-center justify-center font-bold text-[12px] shrink-0">
                      {order.checklist?.raederFestgezogen ? "✓" : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium leading-tight">
                      Elektrik
                      <br />
                      Kontrolle
                    </span>
                    <span className="w-[6.5mm] h-[6.5mm] border border-slate-800 flex items-center justify-center font-bold text-[12px] shrink-0">
                      {order.checklist?.elektrikGeprueft ? "✓" : ""}
                    </span>
                  </div>

                  <div className="flex items-center text-[9.5px] text-slate-600 leading-tight">
                    <span className="truncate">
                      {formatOrderAssetSummary(order, lang, trText)}
                    </span>
                  </div>
                </div>

                {/* Right: Kosten Kunden mitgeteilt 3-column ruled table */}
                <div className="col-span-5">
                  <table className="w-full border-collapse text-[10px]">
                    <tbody>
                      <tr className="border-b border-slate-500">
                        <td className="py-1 pr-1.5 font-medium leading-tight border-r border-slate-500 w-[44%]">
                          Kosten Kunden
                          <br />
                          mitgeteilt
                        </td>
                        <td className="py-1 px-1.5 border-r border-slate-500 font-mono font-bold text-center w-[28%]">
                          {isOffice && clientDetails?.estimatedCostEur !== undefined
                            ? `${clientDetails.estimatedCostEur} €`
                            : ""}
                        </td>
                        <td className="py-1 pl-1.5 font-semibold text-center truncate w-[28%]">
                          {clientDecisionShort}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-500 h-[6.5mm]">
                        <td className="py-1 pr-1.5 border-r border-slate-500 font-medium">
                          Datum:
                        </td>
                        <td className="py-1 px-1.5 border-r border-slate-500 font-mono text-center">
                          {isOffice && clientDetails?.costCommunicatedAt
                            ? format(parseISO(clientDetails.costCommunicatedAt), "dd.MM.yy")
                            : ""}
                        </td>
                        <td className="py-1 pl-1.5 font-mono text-center">
                          {isOffice && clientDetails?.clientDecisionAt
                            ? format(parseISO(clientDetails.clientDecisionAt), "dd.MM.yy")
                            : ""}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-500 h-[6mm]">
                        <td
                          colSpan={3}
                          className="py-0.5 px-1 text-[9.5px] text-slate-700 truncate"
                        >
                          {isOffice && clientDetails?.clientDecisionNote
                            ? trText(clientDetails.clientDecisionNote)
                            : ""}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ================= MIDDLE SECTION: MÄNGELANZEIGE ================= */}
            <div className="mt-2">
              <div className="text-[11px] font-bold text-slate-950 mb-0.5">
                Mängelanzeige:
              </div>
              {maengelLines.map((line, idx) => (
                <div
                  key={`maengel_${idx}`}
                  className="border-b border-slate-500 h-[6mm] flex items-end pb-[0.8mm] text-[10.5px] text-slate-900 truncate"
                >
                  {line}
                </div>
              ))}
              <div className="flex justify-end mt-1.5">
                <div className="w-[58mm] text-center">
                  <div className="border-b border-slate-500 h-[4.5mm] text-[9.5px] font-medium text-slate-700 truncate">
                    {isOffice && clientDetails?.clientDecision === "approved"
                      ? `✓ ${w.decisionApproved}`
                      : ""}
                  </div>
                  <div className="text-[9px] font-medium text-slate-800 mt-0.5">
                    Unterschrift des Kunden
                  </div>
                </div>
              </div>
            </div>

            {/* ================= ARBEITSAUFWAND ================= */}
            <div className="mt-1">
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="text-[11px] font-bold text-slate-950">
                  Arbeitsaufwand
                </span>
                <span className="text-[9.5px] font-mono text-slate-600">
                  {assignedNames.length > 0
                    ? `${assignedNames.join(", ")} · ${formatMinutesAsHours(totalMinutes)}`
                    : w.unassignedStatusLabel}
                </span>
              </div>
              {arbeitsRows.map((row, idx) => (
                <div
                  key={`arb_${idx}`}
                  className="grid grid-cols-2 gap-4 border-b border-slate-500 h-[5.8mm] items-end pb-[0.8mm]"
                >
                  <div className="text-[10px] text-slate-900 truncate pr-2 border-r border-slate-300">
                    {row.left}
                  </div>
                  <div className="text-[10px] text-slate-900 truncate">
                    {row.right}
                  </div>
                </div>
              ))}
            </div>

            {/* ================= MATERIAL ================= */}
            <div className="mt-1.5">
              <div className="text-[11px] font-bold text-slate-950 mb-0.5">
                Material:
              </div>
              {materialRows.map((row, idx) => (
                <div
                  key={`mat_${idx}`}
                  className="grid grid-cols-2 gap-4 border-b border-slate-500 h-[5.8mm] items-end pb-[0.8mm]"
                >
                  <div className="text-[10px] text-slate-900 truncate pr-2 border-r border-slate-300">
                    {row.left}
                  </div>
                  <div className="text-[10px] text-slate-900 truncate">
                    {row.right}
                  </div>
                </div>
              ))}
            </div>

            {/* ================= BOTTOM SECTION: MONTEUR TABLE & SIGNATURES ================= */}
            <div className="grid grid-cols-12 gap-5 pt-2 items-end">
              {/* Left: Monteur | MO | DI | MI | DO | FR Table */}
              <div className="col-span-6">
                <table className="w-full border-collapse border border-slate-800 text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-50">
                      <th className="border-r border-slate-800 py-1 px-1.5 text-left font-bold w-[38%]">
                        Monteur
                      </th>
                      {WEEKDAY_KEYS.map((day) => (
                        <th
                          key={day}
                          className="border-r last:border-r-0 border-slate-800 py-1 px-1 text-center font-bold w-[12.4%]"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monteurRows.map((row, idx) => (
                      <tr
                        key={`mon_${idx}`}
                        className="border-b last:border-b-0 border-slate-700 h-[6.2mm]"
                      >
                        <td className="border-r border-slate-800 px-1.5 font-semibold truncate max-w-[32mm]">
                          {row ? row.name : ""}
                        </td>
                        {WEEKDAY_KEYS.map((day) => (
                          <td
                            key={day}
                            className="border-r last:border-r-0 border-slate-800 px-1 text-center font-mono"
                          >
                            {row ? formatHoursCompact(row.days[day]) : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right: 3 Signature & Final Control Lines */}
              <div className="col-span-6 space-y-2.5">
                {/* Line 1: Unterschrift Monteur / Räder angezogen */}
                <div className="relative">
                  <div className="border-b border-slate-800 h-[9mm] flex items-end justify-between pb-0.5 gap-2">
                    <span className="text-[10px] font-semibold text-slate-900 truncate">
                      {order.finalProtocol?.signedByMechanicName ||
                        (assignedNames.length > 0 ? assignedNames.join(", ") : "")}
                    </span>
                    {order.finalProtocol?.mechanicSignatureDataUrl && (
                      <img
                        src={order.finalProtocol.mechanicSignatureDataUrl}
                        alt="Unterschrift Monteur"
                        className="h-[8.5mm] max-w-[36mm] object-contain"
                      />
                    )}
                  </div>
                  <div className="text-[9.5px] font-semibold text-slate-900 mt-0.5">
                    Unterschrift Monteur / Räder angezogen
                  </div>
                </div>

                {/* Line 2: Unterschrift Monteur / wieviel Nm */}
                <div>
                  <div className="border-b border-slate-800 h-[6.2mm] flex items-end justify-between pb-0.5">
                    <span className="text-[10.5px] font-mono font-bold text-slate-950">
                      {order.wheelTorqueNm ? `${order.wheelTorqueNm} Nm` : ""}
                    </span>
                  </div>
                  <div className="text-[9.5px] font-semibold text-slate-900 mt-0.5">
                    Unterschrift Monteur / wieviel Nm
                  </div>
                </div>

                {/* Line 3: Endkontrolle / την τελική επιθεώρηση */}
                <div>
                  <div className="border-b border-slate-800 h-[6.2mm] flex items-end justify-between gap-2 pb-0.5">
                    <span className="text-[9.5px] text-slate-900 truncate">
                      {order.finalProtocol?.finalSummary
                        ? trText(order.finalProtocol.finalSummary)
                        : ""}
                    </span>
                    {order.finalProtocol?.completedAt && (
                      <span className="text-[9px] font-mono text-slate-700 shrink-0">
                        {format(
                          parseISO(order.finalProtocol.completedAt),
                          "dd.MM.yyyy"
                        )}
                      </span>
                    )}
                  </div>
                  <div className="text-[9.5px] font-semibold text-slate-900 mt-0.5">
                    Endkontrolle / την τελική επιθεώρηση
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {w.closeBtn}
          </Button>
          <Button onClick={handlePrint} className="gap-1.5">
            <Printer className="w-4 h-4" />
            <span>{w.printPdfBtn}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
