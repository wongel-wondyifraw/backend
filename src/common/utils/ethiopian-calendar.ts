export type DatePrecision = "day" | "month" | "year";
export type CalendarSystem = "gc" | "ec";

export interface CalendarDateValue {
  year: number;
  month: number;
  day: number;
}

export interface ParsedCalendarDate {
  /** Canonical Gregorian ISO date (YYYY-MM-DD) for DB DATE storage */
  isoDate: string;
  precision: DatePrecision;
  calendar: CalendarSystem;
  /** Parsed year in the declared calendar */
  year: number;
  /** Parsed month in the declared calendar (1 if precision === 'year') */
  month: number;
  /** Parsed day in the declared calendar (1 if precision !== 'day') */
  day: number;
}

export const ETHIOPIC_MONTHS = [
  { value: 1, name: "Meskerem", amharic: "መስከረም" },
  { value: 2, name: "Tikimt", amharic: "ጥቅምት" },
  { value: 3, name: "Hidar", amharic: "ኅዳር" },
  { value: 4, name: "Tahsas", amharic: "ታኅሣሥ" },
  { value: 5, name: "Tir", amharic: "ጥር" },
  { value: 6, name: "Yekatit", amharic: "የካቲት" },
  { value: 7, name: "Megabit", amharic: "መጋቢት" },
  { value: 8, name: "Miazia", amharic: "ሚያዝያ" },
  { value: 9, name: "Ginbot", amharic: "ግንቦት" },
  { value: 10, name: "Sene", amharic: "ሰኔ" },
  { value: 11, name: "Hamle", amharic: "ሐምሌ" },
  { value: 12, name: "Nehase", amharic: "ነሐሴ" },
  { value: 13, name: "Pagume", amharic: "ጳጉሜን" },
] as const;

/**
 * Julian Day Number of Ethiopian calendar origin (0000-01-01 E.C.).
 * Verified against 2000-01-01 E.C. == 2007-09-12 G.C. (JDN 2454356).
 */
const ETHIOPIC_JDN_OFFSET = 1723856;
const MIN_YEAR = 1800;
const MAX_YEAR = 2200;

export function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getGregorianMonthDays(year: number, month: number): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return 0;
  }
  const days = [
    31,
    isGregorianLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return days[month - 1];
}

export function isValidGregorianDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return false;
  }
  const maxDay = getGregorianMonthDays(year, month);
  return maxDay > 0 && Number.isInteger(day) && day >= 1 && day <= maxDay;
}

export function isEthiopianLeapYear(year: number): boolean {
  return ((year % 4) + 4) % 4 === 3;
}

export function getEthiopianMonthDays(year: number, month: number): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 13) {
    return 0;
  }
  if (month === 13) {
    return isEthiopianLeapYear(year) ? 6 : 5;
  }
  return 30;
}

export function isValidEthiopianDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return false;
  }
  const maxDay = getEthiopianMonthDays(year, month);
  return maxDay > 0 && Number.isInteger(day) && day >= 1 && day <= maxDay;
}

export function gcToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export function jdnToGc(jdn: number): CalendarDateValue {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);

  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

export function ecToJdn(year: number, month: number, day: number): number {
  return (
    ETHIOPIC_JDN_OFFSET +
    365 * year +
    Math.floor(year / 4) +
    30 * (month - 1) +
    (day - 1)
  );
}

export function jdnToEc(jdn: number): CalendarDateValue {
  const d0 = jdn - ETHIOPIC_JDN_OFFSET;
  const cycle4 = Math.floor(d0 / 1461);
  const rem4 = d0 - cycle4 * 1461;
  const yearOffset = Math.min(3, Math.floor(rem4 / 365));
  const year = cycle4 * 4 + yearOffset;
  const dayOfYear = rem4 - yearOffset * 365;
  const month = Math.floor(dayOfYear / 30) + 1;
  const day = (dayOfYear % 30) + 1;
  return { year, month, day };
}

export function ecToGc(
  year: number,
  month: number,
  day: number,
): CalendarDateValue {
  if (!isValidEthiopianDate(year, month, day)) {
    throw new Error(`Invalid Ethiopian date: ${year}-${month}-${day}`);
  }
  return jdnToGc(ecToJdn(year, month, day));
}

export function gcToEc(
  year: number,
  month: number,
  day: number,
): CalendarDateValue {
  if (!isValidGregorianDate(year, month, day)) {
    throw new Error(`Invalid Gregorian date: ${year}-${month}-${day}`);
  }
  return jdnToEc(gcToJdn(year, month, day));
}

export function formatIsoDate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function gcIsoToEc(isoDate: string): CalendarDateValue | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!isValidGregorianDate(y, m, d)) return null;
  return gcToEc(y, m, d);
}

export interface ParseCalendarOptions {
  /** Override calendar ('gc' | 'ec') when string omits inline marker */
  calendar?: CalendarSystem | null;
  /** Explicit precision override when caller submits anchored YYYY-MM-DD */
  precision?: DatePrecision | null;
  /** Whether partial dates (YYYY, YYYY-MM) are accepted (default: true) */
  allowPartial?: boolean;
}

const PREFIX_TAG_RE = /^(ec|e\.c\.|gc|g\.c\.)\s*:\s*(.+)$/i;
const SUFFIX_TAG_RE = /^(.+?)\s+(ec|e\.c\.|gc|g\.c\.)$/i;
const FULL_ISO_RE =
  /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;
const MONTH_ONLY_RE = /^(\d{4})-(\d{1,2})$/;
const YEAR_ONLY_RE = /^(\d{4})$/;

/**
 * Parse a YYYY, YYYY-MM, YYYY-MM-DD (or inline-tagged `"1984 EC"` / `"EC:1984"`)
 * date string in either Gregorian or Ethiopian calendar, validate its calendar
 * days (including Pagume 5/6 leap rule), and return the canonical Gregorian ISO
 * date paired with `precision` and `calendar`.
 * Returns `null` if invalid or disallowed partial precision.
 */
export function parseFlexibleCalendarDate(
  rawInput: string,
  options: ParseCalendarOptions = {},
): ParsedCalendarDate | null {
  if (typeof rawInput !== "string") return null;
  let core = rawInput.trim();
  if (!core) return null;

  let inlineCalendar: CalendarSystem | null = null;
  const prefixMatch = PREFIX_TAG_RE.exec(core);
  if (prefixMatch) {
    inlineCalendar = prefixMatch[1].toLowerCase().startsWith("e") ? "ec" : "gc";
    core = prefixMatch[2].trim();
  } else {
    const suffixMatch = SUFFIX_TAG_RE.exec(core);
    if (suffixMatch) {
      inlineCalendar = suffixMatch[2].toLowerCase().startsWith("e")
        ? "ec"
        : "gc";
      core = suffixMatch[1].trim();
    }
  }

  // Reject conflicting explicit calendar header vs inline tag
  if (
    inlineCalendar &&
    options.calendar &&
    inlineCalendar !== options.calendar
  ) {
    return null;
  }

  const calendar: CalendarSystem = inlineCalendar ?? options.calendar ?? "gc";
  const allowPartial = options.allowPartial ?? true;

  let detectedPrecision: DatePrecision;
  let year: number;
  let month = 1;
  let day = 1;

  const yearMatch = YEAR_ONLY_RE.exec(core);
  const monthMatch = MONTH_ONLY_RE.exec(core);
  const fullMatch = FULL_ISO_RE.exec(core);

  if (yearMatch) {
    detectedPrecision = "year";
    year = Number(yearMatch[1]);
  } else if (monthMatch) {
    detectedPrecision = "month";
    year = Number(monthMatch[1]);
    month = Number(monthMatch[2]);
  } else if (fullMatch) {
    detectedPrecision = "day";
    year = Number(fullMatch[1]);
    month = Number(fullMatch[2]);
    day = Number(fullMatch[3]);
  } else {
    return null;
  }

  const precisionOrder: Record<DatePrecision, number> = {
    year: 0,
    month: 1,
    day: 2,
  };
  if (
    options.precision &&
    precisionOrder[options.precision] > precisionOrder[detectedPrecision]
  ) {
    return null;
  }

  const precision: DatePrecision = options.precision ?? detectedPrecision;
  if (!allowPartial && precision !== "day") {
    return null;
  }

  // Normalize partial anchors deterministically
  const anchoredMonth = precision === "year" ? 1 : month;
  const anchoredDay = precision === "day" ? day : 1;

  if (calendar === "ec") {
    if (!isValidEthiopianDate(year, anchoredMonth, anchoredDay)) {
      return null;
    }
    const gc = ecToGc(year, anchoredMonth, anchoredDay);
    return {
      isoDate: formatIsoDate(gc.year, gc.month, gc.day),
      precision,
      calendar: "ec",
      year,
      month: anchoredMonth,
      day: anchoredDay,
    };
  }

  if (!isValidGregorianDate(year, anchoredMonth, anchoredDay)) {
    return null;
  }
  return {
    isoDate: formatIsoDate(year, anchoredMonth, anchoredDay),
    precision,
    calendar: "gc",
    year,
    month: anchoredMonth,
    day: anchoredDay,
  };
}

/**
 * Compute integer age in years from a canonical Gregorian ISO date stored in DB
 * (`date_of_birth`), relative to `now` (defaults to current date).
 */
export function computeAgeFromIsoDate(
  canonicalIsoDate: string | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!canonicalIsoDate) return null;
  const isoStr =
    canonicalIsoDate instanceof Date
      ? canonicalIsoDate.toISOString().slice(0, 10)
      : String(canonicalIsoDate).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoStr);
  if (!match) return null;

  const birthYear = Number(match[1]);
  const birthMonth = Number(match[2]);
  const birthDay = Number(match[3]);
  const todayYear = now.getUTCFullYear();
  const todayMonth = now.getUTCMonth() + 1;
  const todayDay = now.getUTCDate();

  let age = todayYear - birthYear;
  if (
    todayMonth < birthMonth ||
    (todayMonth === birthMonth && todayDay < birthDay)
  ) {
    age -= 1;
  }
  return Math.max(0, age);
}

/**
 * Expand a partial filter query (e.g., joined_from / joined_to) into canonical
 * inclusive Gregorian YYYY-MM-DD bounds.
 */
export function resolveFilterDateBound(
  rawInput: string,
  bound: "start" | "end",
  calendar?: CalendarSystem | null,
): string | null {
  const parsed = parseFlexibleCalendarDate(rawInput, {
    calendar: calendar ?? null,
    allowPartial: true,
  });
  if (!parsed) return null;
  if (bound === "start" || parsed.precision === "day") {
    return parsed.isoDate;
  }

  if (parsed.calendar === "ec") {
    const endMonth = parsed.precision === "year" ? 13 : parsed.month;
    const endDay = getEthiopianMonthDays(parsed.year, endMonth);
    const gc = ecToGc(parsed.year, endMonth, endDay);
    return formatIsoDate(gc.year, gc.month, gc.day);
  }

  const endMonth = parsed.precision === "year" ? 12 : parsed.month;
  const endDay = getGregorianMonthDays(parsed.year, endMonth);
  return formatIsoDate(parsed.year, endMonth, endDay);
}
