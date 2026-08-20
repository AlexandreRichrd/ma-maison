import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { formatIsoWeek } from "./week";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

export function parseIsoDate(isoDate: string): Date {
  if (!isValidIsoDate(isoDate)) {
    throw new Error(`Invalid ISO date string: ${isoDate}`);
  }
  return new Date(`${isoDate}T00:00:00`);
}

export function formatIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getCurrentIsoDate(): string {
  return formatIsoDate(new Date());
}

export function shiftIsoDate(isoDate: string, deltaDays: number): string {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() + deltaDays);
  return formatIsoDate(date);
}

/** Which ISO week (`2026-W32`) a day falls in — the persistent weekly
 * block always reflects whichever week contains the selected day. */
export function isoWeekOfDate(isoDate: string): string {
  return formatIsoWeek(parseIsoDate(isoDate));
}

export function formatDayLabel(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  const label = format(date, "EEEE d MMMM", { locale: fr });
  const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
  const prefix = isoDate === getCurrentIsoDate() ? "Aujourd'hui · " : "";
  return `${prefix}${capitalized}`;
}
