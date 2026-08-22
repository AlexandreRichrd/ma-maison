import {
  addDays,
  addMonths,
  addWeeks,
  endOfISOWeek,
  endOfMonth,
  format,
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  setISOWeekYear,
  startOfISOWeek,
  startOfMonth,
} from "date-fns";
import { fr } from "date-fns/locale";

const ISO_WEEK_PATTERN = /^(\d{4})-W(\d{2})$/;

export function isValidIsoWeek(value: string): boolean {
  const match = ISO_WEEK_PATTERN.exec(value);
  if (!match) return false;
  const week = Number(match[2]);
  return week >= 1 && week <= 53;
}

export function parseIsoWeek(isoWeek: string): Date {
  const match = ISO_WEEK_PATTERN.exec(isoWeek);
  if (!match) {
    throw new Error(`Invalid ISO week string: ${isoWeek}`);
  }
  const [, year, week] = match;
  const withYear = setISOWeekYear(new Date(), Number(year));
  return startOfISOWeek(setISOWeek(withYear, Number(week)));
}

export function formatIsoWeek(date: Date): string {
  const year = getISOWeekYear(date);
  const week = String(getISOWeek(date)).padStart(2, "0");
  return `${year}-W${week}`;
}

export function getCurrentIsoWeek(): string {
  return formatIsoWeek(new Date());
}

export function shiftIsoWeek(isoWeek: string, deltaWeeks: number): string {
  const start = parseIsoWeek(isoWeek);
  const shifted = new Date(start);
  shifted.setDate(shifted.getDate() + deltaWeeks * 7);
  return formatIsoWeek(shifted);
}

export function formatWeekLabel(isoWeek: string): string {
  const start = parseIsoWeek(isoWeek);
  const end = endOfISOWeek(start);
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = format(start, sameMonth ? "d" : "d MMMM", { locale: fr });
  const endLabel = format(end, "d MMMM", { locale: fr });
  const prefix = isoWeek === getCurrentIsoWeek() ? "Cette semaine · " : "";
  return `${prefix}${startLabel} – ${endLabel}`;
}

/** The 7 calendar days (Monday..Sunday) an ISO week spans, as Dates. */
export function isoWeekDays(isoWeek: string): Date[] {
  const start = parseIsoWeek(isoWeek);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Month navigation for the reminders month view — moves the anchor week's
 * Monday by a calendar month, then re-derives which ISO week that lands in.
 * Kept in week.ts (not a second date module) since the calendar's only
 * persisted state is `?week=`; month view is just a different rendering of
 * the same anchor, see reminders.tsx.
 */
export function shiftIsoWeekByMonths(isoWeek: string, deltaMonths: number): string {
  const start = parseIsoWeek(isoWeek);
  return formatIsoWeek(addMonths(start, deltaMonths));
}

/**
 * ISO week strings that together tile the full grid needed to display the
 * calendar month containing `isoWeek`'s Monday — always whole weeks (a
 * month display never starts mid-week), so 4-6 rows depending on how the
 * month's start/end align with week boundaries.
 */
export function monthGridWeeks(isoWeek: string): string[] {
  const anchor = parseIsoWeek(isoWeek);
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfISOWeek(monthStart);
  const gridEnd = endOfISOWeek(monthEnd);

  const weeks: string[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addWeeks(cursor, 1)) {
    weeks.push(formatIsoWeek(cursor));
  }
  return weeks;
}

/** Whether `date` falls in the calendar month containing `isoWeek`'s Monday
 * — used to dim the leading/trailing days a month grid pads out with. */
export function isInMonthOf(date: Date, isoWeek: string): boolean {
  const anchor = parseIsoWeek(isoWeek);
  return date.getMonth() === anchor.getMonth() && date.getFullYear() === anchor.getFullYear();
}

export function formatMonthLabel(isoWeek: string): string {
  const anchor = parseIsoWeek(isoWeek);
  const label = format(anchor, "MMMM yyyy", { locale: fr });
  const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
  const prefix = isInMonthOf(new Date(), isoWeek) ? "Ce mois-ci · " : "";
  return `${prefix}${capitalized}`;
}
