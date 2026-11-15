"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  History,
  Printer,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { useApp } from "@/lib/context";
import { translations } from "@/lib/translations";
import { Trailer } from "@/lib/store";
import {
  TUV_THRESHOLDS,
  TuvFilter,
  compareTuv,
  dateInputToIso,
  getTuvInfo,
  matchesTuvFilter,
  toDateInputValue,
  tuvStatusBadgeClass,
  tuvStatusRowClass,
} from "@/lib/tuv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { printDocument } from "@/lib/print";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SOLD_HINT = /sprzedan|verkauft|sold|abgemeldet|wycofan/i;

export function TuvManager() {
  const { trailers, language, isOffice, updateTrailerTuv } = useApp();
  const t = translations[language as keyof typeof translations] || translations.pl;

  const [filter, setFilter] = useState<TuvFilter>("all");
  const [search, setSearch] = useState("");
  const [hideSold, setHideSold] = useState(true);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [editing, setEditing] = useState<Trailer | null>(null);
  const [draftDate, setDraftDate] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [historyOpenFor, setHistoryOpenFor] = useState<Trailer | null>(null);

  // Stable "today" reference for the whole render pass (keeps useMemo deps settled)
  const now = useMemo(() => new Date(), []);

  const stats = useMemo(() => {
    const base = trailers.filter((tr) => !hideSold || !SOLD_HINT.test(tr.notes || ""));
    const counters = { total: base.length, expired: 0, d30: 0, d60: 0, d90: 0, none: 0 };
    base.forEach((tr) => {
      const info = getTuvInfo(tr, now);
      if (info.daysLeft === null) {
        counters.none += 1;
        return;
      }
      if (info.daysLeft < 0) counters.expired += 1;
      if (info.daysLeft <= TUV_THRESHOLDS.critical) counters.d30 += 1;
      if (info.daysLeft <= TUV_THRESHOLDS.soon) counters.d60 += 1;
      if (info.daysLeft <= TUV_THRESHOLDS.watch) counters.d90 += 1;
    });
    return counters;
  }, [trailers, hideSold, now]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return trailers
      .filter((tr) => !hideSold || !SOLD_HINT.test(tr.notes || ""))
      .filter((tr) => matchesTuvFilter(tr, filter, now))
      .filter((tr) => {
        if (!term) return true;
        return [tr.plate, tr.vin, tr.model, tr.type, tr.notes]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term));
      })
      .sort((a, b) => (sortDir === "asc" ? compareTuv(a, b) : compareTuv(b, a)));
  }, [trailers, hideSold, filter, search, sortDir, now]);

  const statusLabel = (status: ReturnType<typeof getTuvInfo>["status"]) => {
    switch (status) {
      case "expired":
        return t.tuvStatusExpired;
      case "critical":
        return t.tuvStatusCritical;
      case "soon":
        return t.tuvStatusSoon;
      case "valid":
        return t.tuvStatusOk;
      default:
        return t.tuvStatusUnknown;
    }
  };

  const openEditor = (trailer: Trailer) => {
    if (!isOffice) {
      toast.error(t.tuvNoPermission);
      return;
    }
    setEditing(trailer);
    setDraftDate(toDateInputValue(trailer.tuvExpiry));
    setDraftNote("");
  };

  const applyPreset = (months?: number, clear = false) => {
    if (clear) {
      setDraftDate("");
      return;
    }
    const base = draftDate ? parseISO(draftDate) : new Date();
    const next = new Date(base.getTime());
    if (months === 0) {
      setDraftDate(toDateInputValue(new Date()));
      return;
    }
    next.setMonth(next.getMonth() + (months || 0));
    setDraftDate(toDateInputValue(next));
  };

  const handleSave = () => {
    if (!editing) return;
    const iso = draftDate ? dateInputToIso(draftDate) : undefined;
    if (draftDate && !iso) {
      toast.error(t.tuvInvalidDate);
      return;
    }
    const changed = updateTrailerTuv(editing.id, iso, draftNote);
    if (changed) {
      toast.success(t.tuvSavedToast);
      setEditing(null);
    } else {
      toast.info(t.tuvSavedToast);
      setEditing(null);
    }
  };

  const handlePrint = () => {
    setTimeout(() => {
      const ok = printDocument("print-area-tuv", t.tuvPrintTitle);
      if (!ok) toast.error(t.popupBlockedError || t.tuvNoPermission);
    }, 300);
  };

  const filterChips: {
    id: TuvFilter;
    label: string;
    count: number;
    tone: string;
    activeClass: string;
  }[] = [
    { id: "all", label: t.tuvFilterAll, count: stats.total, tone: "text-slate-700", activeClass: "border-slate-400 ring-slate-300/40" },
    { id: "expired", label: t.tuvFilterExpired, count: stats.expired, tone: "text-rose-700", activeClass: "border-rose-400 ring-rose-200" },
    { id: "d30", label: t.tuvFilter30, count: stats.d30, tone: "text-amber-700", activeClass: "border-amber-400 ring-amber-200" },
    { id: "d60", label: t.tuvFilter60, count: stats.d60, tone: "text-yellow-700", activeClass: "border-yellow-400 ring-yellow-200" },
    { id: "d90", label: t.tuvFilter90, count: stats.d90, tone: "text-sky-700", activeClass: "border-sky-400 ring-sky-200" },
    { id: "none", label: t.tuvFilterNone, count: stats.none, tone: "text-slate-500", activeClass: "border-slate-400 ring-slate-200" },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-100">
              {t.tuvManagerTitle}
            </h2>
            <p className="max-w-xl text-xs text-muted-foreground">{t.tuvManagerSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handlePrint} className="h-9 text-[11px] font-black uppercase tracking-wider">
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            {t.tuvPrint}
          </Button>
          {!isOffice && (
            <Badge variant="outline" className="h-9 gap-1.5 px-3 text-[10px] font-black uppercase tracking-wider text-amber-700">
              <ShieldAlert className="h-3.5 w-3.5" />
              {t.tuvReadOnlyNotice}
            </Badge>
          )}
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {filterChips.map((chip) => {
          const active = filter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={cn(
                "group flex flex-col items-start rounded-xl border bg-card px-3 py-2.5 text-left transition-all hover:shadow-sm",
                active ? cn("ring-2", chip.activeClass) : "border-border hover:border-slate-300"
              )}
            >
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                {chip.label}
              </span>
              <span className={cn("text-2xl font-black tabular-nums leading-tight", chip.tone)}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-slate-50/70 p-2 dark:bg-slate-900/40">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.tuvSearchPlaceholder}
            className="h-9 bg-white pl-9 text-xs font-semibold dark:bg-slate-950"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:bg-slate-950">
          <input
            type="checkbox"
            checked={hideSold}
            onChange={(e) => setHideSold(e.target.checked)}
            className="h-3.5 w-3.5 accent-primary"
          />
          {t.tuvHideSold}
        </label>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="h-9 text-[11px] font-black uppercase tracking-wider"
        >
          <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
          {t.tuvExpiry}
          {sortDir === "asc" ? (
            <ChevronUp className="ml-1 h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* ── Desktop table ──────────────────────────────────────── */}
      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-slate-900/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider">{t.plate}</TableHead>
              <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider">{t.type}</TableHead>
              <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider">{t.model}</TableHead>
              <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider">{t.tuvExpiry}</TableHead>
              <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider">{t.tuvLastChange}</TableHead>
              <TableHead className="h-11 text-right text-[10px] font-black uppercase tracking-wider">
                {t.actionLabel}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((trailer) => {
              const info = getTuvInfo(trailer, now);
              return (
                <TableRow key={trailer.id} className={cn("border-b", tuvStatusRowClass[info.status])}>
                  <TableCell className="py-2.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black leading-none text-slate-900 dark:text-slate-100">
                        {trailer.plate || <span className="italic text-slate-400">{t.noPlate}</span>}
                      </span>
                      {trailer.vin && (
                        <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-slate-400">
                          {trailer.vin}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded border bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {(t.trailerTypes as Record<string, string>)[trailer.type] || trailer.type}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[190px]">
                    <div className="flex flex-col">
                      <span className="truncate text-[12px] font-bold text-slate-800 dark:text-slate-200" title={trailer.model}>
                        {trailer.model || "-"}
                      </span>
                      {trailer.notes && (
                        <span className="truncate text-[10px] font-bold uppercase tracking-tighter text-amber-600" title={trailer.notes}>
                          {trailer.notes}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TuvDateCell trailer={trailer} label={statusLabel(info.status)} daysLabel={(d) =>
                      d < 0 ? `${Math.abs(d)} ${t.tuvDaysOverdue}` : `${d} ${t.tuvDaysLeft}`
                    } />
                  </TableCell>
                  <TableCell>
                    {trailer.tuvLastUpdatedAt ? (
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {format(parseISO(trailer.tuvLastUpdatedAt), "dd.MM.yyyy HH:mm")}
                        </span>
                        <span className="text-[10px] text-slate-400">{trailer.tuvLastUpdatedBy}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] italic text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isOffice}
                        onClick={() => openEditor(trailer)}
                        className="h-7 px-2 text-[10px] font-black uppercase tracking-wider text-primary"
                      >
                        <CalendarPlus className="mr-1 h-3 w-3" />
                        {t.tuvEditBtn}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setHistoryOpenFor(trailer)}
                        title={t.tuvHistoryTitle}
                        className="h-7 w-7 text-slate-400 hover:text-primary"
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  {t.tuvNoTrailers}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile cards ───────────────────────────────────────── */}
      <div className="space-y-2 md:hidden">
        {rows.map((trailer) => {
          const info = getTuvInfo(trailer, now);
          return (
            <div
              key={trailer.id}
              className={cn("rounded-xl border p-3", tuvStatusRowClass[info.status])}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate text-sm font-black text-slate-900 dark:text-slate-100">
                      {trailer.plate || t.noPlate}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
                    {trailer.model || "-"} · {(t.trailerTypes as Record<string, string>)[trailer.type] || trailer.type}
                  </p>
                </div>
                <Badge className={cn("shrink-0 border text-[8px] font-black uppercase tracking-wider", tuvStatusBadgeClass[info.status])}>
                  {statusLabel(info.status)}
                </Badge>
              </div>

              <div className="mt-2 flex items-end justify-between gap-2">
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    {t.tuvExpiry}
                  </span>
                  <span className="text-sm font-black tabular-nums text-slate-800 dark:text-slate-200">
                    {info.expiry ? format(info.expiry, "dd.MM.yyyy") : t.tuvNoDate}
                  </span>
                  {info.daysLeft !== null && (
                    <span className="ml-1.5 text-[10px] font-bold text-slate-500">
                      ({info.daysLeft < 0
                        ? `${Math.abs(info.daysLeft)} ${t.tuvDaysOverdue}`
                        : `${info.daysLeft} ${t.tuvDaysLeft}`})
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!isOffice}
                    onClick={() => openEditor(trailer)}
                    className="h-8 px-2 text-[10px] font-black uppercase"
                  >
                    <CalendarPlus className="mr-1 h-3 w-3" />
                    {t.tuvEditBtn}
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setHistoryOpenFor(trailer)} className="h-8 w-8">
                    <History className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed py-8 text-center text-xs text-muted-foreground">
            {t.tuvNoTrailers}
          </div>
        )}
      </div>

      {/* ── Edit dialog ────────────────────────────────────────── */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent size="compact" className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              {t.tuvEditTitle}
            </DialogTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                {editing?.plate || t.noPlate}
              </span>
              <span className="text-slate-400">·</span>
              <span>{editing?.model || "-"}</span>
              {editing?.vin && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono text-[10px]">{editing.vin}</span>
                </>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Current + new value */}
            <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2 dark:bg-slate-900/50">
              <div>
                <span className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  {t.tuvExpiry}
                </span>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {editing?.tuvExpiry ? format(parseISO(editing.tuvExpiry), "dd.MM.yyyy") : t.tuvNoDate}
                </span>
              </div>
              <span className="text-slate-300">→</span>
              <div className="text-right">
                <span className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  {t.tuvHistoryNew}
                </span>
                <span className="text-sm font-black text-primary">
                  {draftDate ? format(parseISO(draftDate), "dd.MM.yyyy") : t.tuvNoDate}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tuv-date">{t.tuvExpiry}</Label>
              <Input
                id="tuv-date"
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                className="h-10 text-sm font-bold"
              />
            </div>

            <div className="grid gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                {t.tuvQuickPick}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] font-bold" onClick={() => applyPreset(24)}>
                  {t.tuvQuick2Years}
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] font-bold" onClick={() => applyPreset(12)}>
                  {t.tuvQuick1Year}
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] font-bold" onClick={() => applyPreset(0)}>
                  {t.tuvQuickToday}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] font-bold text-rose-600"
                  onClick={() => applyPreset(undefined, true)}
                >
                  <X className="mr-1 h-3 w-3" />
                  {t.tuvQuickClear}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tuv-note">{t.tuvNoteLabel}</Label>
              <Input
                id="tuv-note"
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder={t.tuvNotePlaceholder}
              />
            </div>

            {editing?.tuvHistory && editing.tuvHistory.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-2.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  <History className="h-3 w-3" />
                  {t.tuvHistoryTitle}
                </div>
                <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
                  {editing.tuvHistory.slice(0, 6).map((h) => (
                    <div key={h.id} className="flex flex-wrap items-center gap-x-1.5 text-[10.5px]">
                      <span className="font-mono text-slate-400">
                        {format(parseISO(h.timestamp), "dd.MM.yy HH:mm")}
                      </span>
                      <span className="text-slate-500">
                        {h.previousExpiry ? format(parseISO(h.previousExpiry), "dd.MM.yyyy") : t.tuvHistoryNoPrevious}
                      </span>
                      <span className="text-slate-300">→</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {h.newExpiry ? format(parseISO(h.newExpiry), "dd.MM.yyyy") : "—"}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-500">{h.changedByName}</span>
                      {h.note && <span className="truncate italic text-slate-400">„{h.note}”</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSave} className="font-black uppercase tracking-wider">
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {t.tuvEditSaveBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── History dialog ─────────────────────────────────────── */}
      <Dialog open={Boolean(historyOpenFor)} onOpenChange={(open) => !open && setHistoryOpenFor(null)}>
        <DialogContent size="compact" className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              {t.tuvHistoryTitle}
            </DialogTitle>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                {historyOpenFor?.plate || t.noPlate}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">
                {historyOpenFor?.tuvHistory?.length || 0} {t.tuvHistoryCount}
              </span>
            </div>
          </DialogHeader>

          <div className="py-2">
            {historyOpenFor?.tuvHistory && historyOpenFor.tuvHistory.length > 0 ? (
              <div className="max-h-[55vh] space-y-1.5 overflow-y-auto pr-1">
                {historyOpenFor.tuvHistory.map((h) => (
                  <div key={h.id} className="rounded-lg border bg-card px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[13px]">
                        <span className="text-slate-400">
                          {h.previousExpiry ? format(parseISO(h.previousExpiry), "dd.MM.yyyy") : t.tuvHistoryNoPrevious}
                        </span>
                        <span className="text-slate-300">→</span>
                        <span className="font-black text-slate-800 dark:text-slate-100">
                          {h.newExpiry ? format(parseISO(h.newExpiry), "dd.MM.yyyy") : "—"}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {format(parseISO(h.timestamp), "dd.MM.yyyy HH:mm")}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      {t.tuvUpdatedBy}: <span className="font-bold">{h.changedByName}</span>
                      {h.note && <span className="ml-2 italic">„{h.note}”</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
                <ShieldCheck className="h-8 w-8 text-slate-300" />
                <p className="max-w-[280px] text-xs text-muted-foreground">{t.tuvHistoryEmpty}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setHistoryOpenFor(null)}>
              {t.cancel}
            </Button>
            {isOffice && historyOpenFor && (
              <Button
                onClick={() => {
                  const tr = historyOpenFor;
                  setHistoryOpenFor(null);
                  openEditor(tr);
                }}
              >
                <CalendarPlus className="mr-1.5 h-4 w-4" />
                {t.tuvEditBtn}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Print sheet (hidden on screen, used by printDocument) ── */}
      {rows.length > 0 && (
        <div className="hidden" aria-hidden>
          <div id="print-area-tuv" className="bg-white p-4 font-sans text-black">
            <div className="mb-3 flex items-start justify-between border-b-2 border-black pb-2">
              <div>
                <h1 className="text-lg font-black uppercase tracking-tight">{t.tuvPrintTitle}</h1>
                <p className="text-[11px]">
                  {t.tuvPrintSubtitle} {format(now, "dd.MM.yyyy")}
                  {filter !== "all" && ` · ${filterChips.find((c) => c.id === filter)?.label}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black tracking-tighter">DOLLCO</div>
                <div className="text-[9px] font-bold uppercase tracking-widest">Smart Trailer Manager</div>
              </div>
            </div>

            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border border-black px-1.5 py-1 text-left">{t.tuvPrintColNo}</th>
                  <th className="border border-black px-1.5 py-1 text-left">{t.plate}</th>
                  <th className="border border-black px-1.5 py-1 text-left">{t.vin}</th>
                  <th className="border border-black px-1.5 py-1 text-left">{t.model}</th>
                  <th className="border border-black px-1.5 py-1 text-left">{t.tuvExpiry}</th>
                  <th className="border border-black px-1.5 py-1 text-left">{t.tuvPrintColStatus}</th>
                  <th className="border border-black px-1.5 py-1 text-right">{t.tuvPrintColDays}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((trailer, idx) => {
                  const info = getTuvInfo(trailer, now);
                  return (
                    <tr key={trailer.id}>
                      <td className="border border-black px-1.5 py-0.5">{idx + 1}</td>
                      <td className="border border-black px-1.5 py-0.5 font-bold">{trailer.plate || "-"}</td>
                      <td className="border border-black px-1.5 py-0.5 font-mono text-[9px]">{trailer.vin || "-"}</td>
                      <td className="border border-black px-1.5 py-0.5">{trailer.model || "-"}</td>
                      <td className="border border-black px-1.5 py-0.5 font-bold">
                        {info.expiry ? format(info.expiry, "dd.MM.yyyy") : "-"}
                      </td>
                      <td className="border border-black px-1.5 py-0.5 font-bold uppercase">
                        {statusLabel(info.status)}
                      </td>
                      <td className="border border-black px-1.5 py-0.5 text-right tabular-nums">
                        {info.daysLeft === null ? "-" : info.daysLeft}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-2 flex items-center justify-between text-[9px]">
              <span>{t.tuvPrintFooter}</span>
              <span className="font-bold">
                {t.tuvStatTotal}: {rows.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TuvDateCell({
  trailer,
  label,
  daysLabel,
}: {
  trailer: Trailer;
  label: string;
  daysLabel: (days: number) => string;
}) {
  const info = getTuvInfo(trailer);
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="flex items-center gap-1.5">
        <span className="text-sm font-black tabular-nums text-slate-800 dark:text-slate-100">
          {info.expiry ? format(info.expiry, "dd.MM.yyyy") : "—"}
        </span>
        <Badge className={cn("border text-[8px] font-black uppercase tracking-wider", tuvStatusBadgeClass[info.status])}>
          {label}
        </Badge>
      </span>
      {info.daysLeft !== null && (
        <span
          className={cn(
            "flex items-center gap-1 text-[10px] font-bold",
            info.daysLeft < 0 ? "text-rose-600" : info.daysLeft <= 30 ? "text-amber-600" : "text-slate-400"
          )}
        >
          {info.daysLeft < 0 ? <AlertTriangle className="h-3 w-3" /> : <ClipboardList className="h-3 w-3" />}
          {daysLabel(info.daysLeft)}
        </span>
      )}
    </div>
  );
}
