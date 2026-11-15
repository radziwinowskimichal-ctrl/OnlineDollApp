import { differenceInCalendarDays, parseISO, isValid } from "date-fns";
import { Trailer } from "./store";

/**
 * TÜV deadline buckets used across the app (dashboard, hub, TÜV manager, print).
 * - expired  : date in the past
 * - critical : 0–30 days left
 * - soon     : 31–60 days left
 * - watch    : 61–90 days left
 * - valid    : more than 90 days left
 * - unknown  : no valid date stored
 */
export type TuvStatus = "expired" | "critical" | "soon" | "watch" | "valid" | "unknown";

export interface TuvInfo {
  status: TuvStatus;
  /** Whole calendar days until expiry. Negative = days overdue. null when no date. */
  daysLeft: number | null;
  expiry?: Date;
}

export const TUV_THRESHOLDS = {
  critical: 30,
  soon: 60,
  watch: 90,
} as const;

export function getTuvInfo(trailer: Pick<Trailer, "tuvExpiry">, now: Date = new Date()): TuvInfo {
  if (!trailer.tuvExpiry) {
    return { status: "unknown", daysLeft: null };
  }
  const expiry = parseISO(trailer.tuvExpiry);
  if (!isValid(expiry)) {
    return { status: "unknown", daysLeft: null };
  }
  const daysLeft = differenceInCalendarDays(expiry, now);

  let status: TuvStatus;
  if (daysLeft < 0) status = "expired";
  else if (daysLeft <= TUV_THRESHOLDS.critical) status = "critical";
  else if (daysLeft <= TUV_THRESHOLDS.soon) status = "soon";
  else if (daysLeft <= TUV_THRESHOLDS.watch) status = "watch";
  else status = "valid";

  return { status, daysLeft, expiry };
}

export const tuvStatusBadgeClass: Record<TuvStatus, string> = {
  expired: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900",
  critical: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
  soon: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900",
  watch: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900",
  valid: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  unknown: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
};

export const tuvStatusRowClass: Record<TuvStatus, string> = {
  expired: "bg-rose-50/60 dark:bg-rose-950/20",
  critical: "bg-amber-50/50 dark:bg-amber-950/15",
  soon: "bg-yellow-50/40 dark:bg-yellow-950/10",
  watch: "",
  valid: "",
  unknown: "",
};

/** Sort key — expired first, then nearest, entries without a date last. */
export function compareTuv(a: Pick<Trailer, "tuvExpiry">, b: Pick<Trailer, "tuvExpiry">): number {
  const aHas = Boolean(a.tuvExpiry);
  const bHas = Boolean(b.tuvExpiry);
  if (!aHas && !bHas) return 0;
  if (!aHas) return 1;
  if (!bHas) return -1;
  return parseISO(a.tuvExpiry!).getTime() - parseISO(b.tuvExpiry!).getTime();
}

export type TuvFilter = "all" | "expired" | "d30" | "d60" | "d90" | "none";

export function matchesTuvFilter(
  trailer: Pick<Trailer, "tuvExpiry">,
  filter: TuvFilter,
  now: Date = new Date()
): boolean {
  const info = getTuvInfo(trailer, now);
  switch (filter) {
    case "all":
      return true;
    case "none":
      return info.status === "unknown";
    case "expired":
      return info.status === "expired";
    case "d30":
      return info.daysLeft !== null && info.daysLeft <= TUV_THRESHOLDS.critical;
    case "d60":
      return info.daysLeft !== null && info.daysLeft <= TUV_THRESHOLDS.soon;
    case "d90":
      return info.daysLeft !== null && info.daysLeft <= TUV_THRESHOLDS.watch;
    default:
      return true;
  }
}

export function addMonthsKeepingDay(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const targetDay = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Handle month overflow (e.g. 31 Jan + 1 month)
  if (d.getDate() < targetDay) {
    d.setDate(0);
  }
  return d;
}

/** Local-calendar ISO date part (yyyy-MM-dd) — safe for <input type="date"> round-trips. */
export function toDateInputValue(value?: string | Date): string {
  if (!value) return "";
  const d = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(d)) return "";
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Noon-anchored ISO string so timezone offsets can never shift the TÜV month/day. */
export function dateInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  if (!isValid(parsed)) return undefined;
  const noon = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0);
  return noon.toISOString();
}
