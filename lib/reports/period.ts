import type { ReportKind, ReportPeriod } from "./types";

export const DEMO_REPORT_DATE = "2026-08-05";
export const DEMO_REPORT_TIME_ZONE = "Asia/Shanghai";
const parseDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid report date");
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("Invalid report date");
  return date;
};
const dateLabel = (date: Date) => date.toISOString().slice(0, 10);
export const addCalendarDays = (value: string, days: number) => { const date = parseDate(value); date.setUTCDate(date.getUTCDate() + days); return dateLabel(date); };
function partsFor(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(instant);
  const read = (type: string) => Number(parts.find((item) => item.type === type)?.value ?? 0);
  return Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"), read("second"));
}
export function localMidnightUtc(localDate: string, timeZone: string) {
  let guess = parseDate(localDate).getTime();
  const target = guess;
  for (let index = 0; index < 4; index++) guess += target - partsFor(new Date(guess), timeZone);
  return new Date(guess).toISOString();
}
export function createReportPeriod(kind: ReportKind, selectedDate: string, timeZone = DEMO_REPORT_TIME_ZONE): ReportPeriod {
  const selected = parseDate(selectedDate);
  const dayOfWeek = selected.getUTCDay();
  const start = kind === "weekly" ? addCalendarDays(selectedDate, -((dayOfWeek + 6) % 7)) : selectedDate;
  const end = addCalendarDays(start, kind === "weekly" ? 7 : 1);
  return { kind, timeZone, localStartDate: start, localEndDate: end, startInclusive: localMidnightUtc(start, timeZone), endExclusive: localMidnightUtc(end, timeZone) };
}
