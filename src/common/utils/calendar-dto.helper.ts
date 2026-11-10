import { BadRequestException } from "@nestjs/common";
import {
  type CalendarSystem,
  type DatePrecision,
  parseFlexibleCalendarDate,
} from "./ethiopian-calendar";

export interface ResolvedDateField {
  value: string | null;
  precision: DatePrecision;
  calendar: CalendarSystem;
}

/**
 * Resolves a flexible date input (GC or EC, day/month/year precision) into canonical
 * Gregorian YYYY-MM-DD + metadata. Returns `undefined` when `rawDate === undefined`.
 */
export function resolveDateFieldForWrite(
  fieldName: string,
  rawDate: string | null | undefined,
  options: {
    calendar?: CalendarSystem | null;
    precision?: DatePrecision | null;
    allowPartial?: boolean;
  } = {},
): ResolvedDateField | undefined {
  if (rawDate === undefined) {
    return undefined;
  }
  if (rawDate === null || rawDate.trim() === "") {
    return {
      value: null,
      precision: "day",
      calendar: "gc",
    };
  }
  const parsed = parseFlexibleCalendarDate(rawDate, {
    calendar: options.calendar ?? null,
    precision: options.precision ?? null,
    allowPartial: options.allowPartial ?? true,
  });
  if (!parsed) {
    throw new BadRequestException(
      `Invalid ${fieldName} for the selected calendar`,
    );
  }
  return {
    value: parsed.isoDate,
    precision: parsed.precision,
    calendar: parsed.calendar,
  };
}

