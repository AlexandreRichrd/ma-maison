import {
  endOfISOWeek,
  format,
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  setISOWeekYear,
  startOfISOWeek,
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
