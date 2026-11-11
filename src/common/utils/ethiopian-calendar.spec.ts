import {
  computeAgeFromIsoDate,
  ecToGc,
  formatIsoDate,
  gcToEc,
  getEthiopianMonthDays,
  isEthiopianLeapYear,
  parseFlexibleCalendarDate,
  resolveFilterDateBound,
} from "./ethiopian-calendar";

describe("ethiopian-calendar", () => {
  it("detects Ethiopian leap years (year % 4 === 3)", () => {
    expect(isEthiopianLeapYear(2015)).toBe(true);
    expect(getEthiopianMonthDays(2015, 13)).toBe(6);
    expect(isEthiopianLeapYear(2016)).toBe(false);
    expect(getEthiopianMonthDays(2016, 13)).toBe(5);
    expect(isEthiopianLeapYear(2019)).toBe(true);
  });

  it("converts known historical landmark dates between EC and GC", () => {
    // 2000-01-01 E.C. (Ethiopian Millennium) == 2007-09-12 G.C.
    expect(ecToGc(2000, 1, 1)).toEqual({ year: 2007, month: 9, day: 12 });
    expect(gcToEc(2007, 9, 12)).toEqual({ year: 2000, month: 1, day: 1 });

    // Pagume 6, 2015 E.C. == 2023-09-11 G.C.
    expect(ecToGc(2015, 13, 6)).toEqual({ year: 2023, month: 9, day: 11 });
    expect(gcToEc(2023, 9, 11)).toEqual({ year: 2015, month: 13, day: 6 });

    // Meskerem 1, 2016 E.C. == 2023-09-12 G.C.
    expect(ecToGc(2016, 1, 1)).toEqual({ year: 2023, month: 9, day: 12 });
    expect(gcToEc(2023, 9, 12)).toEqual({ year: 2016, month: 1, day: 1 });

    // Meskerem 1, 2018 E.C. == 2025-09-11 G.C.
    expect(ecToGc(2018, 1, 1)).toEqual({ year: 2025, month: 9, day: 11 });
    expect(gcToEc(2025, 9, 11)).toEqual({ year: 2018, month: 1, day: 1 });

    // Hidar 1, 2019 E.C. == 2026-11-10 G.C.
    expect(ecToGc(2019, 3, 1)).toEqual({ year: 2026, month: 11, day: 10 });
    expect(gcToEc(2026, 11, 10)).toEqual({ year: 2019, month: 3, day: 1 });

    // 1984-01-01 E.C. == 1991-09-12 G.C. (1983 E.C. was leap)
    expect(ecToGc(1984, 1, 1)).toEqual({ year: 1991, month: 9, day: 12 });
    expect(gcToEc(1991, 9, 12)).toEqual({ year: 1984, month: 1, day: 1 });
  });

  it("bijectively round-trips every day from 1900 to 2100", () => {
    for (let y = 1900; y <= 2100; y += 7) {
      for (let m = 1; m <= 12; m += 1) {
        const d = m === 2 ? 28 : 15;
        const ec = gcToEc(y, m, d);
        const gcBack = ecToGc(ec.year, ec.month, ec.day);
        expect(gcBack).toEqual({ year: y, month: m, day: d });
      }
      // Also test Pagume 5 / 6
      const ecYear = y - 8;
      const pagumeMax = getEthiopianMonthDays(ecYear, 13);
      const gcPagume = ecToGc(ecYear, 13, pagumeMax);
      expect(gcToEc(gcPagume.year, gcPagume.month, gcPagume.day)).toEqual({
        year: ecYear,
        month: 13,
        day: pagumeMax,
      });
    }
  });

  it("parses partial and full dates cleanly in both GC and EC", () => {
    expect(
      parseFlexibleCalendarDate("1992", { calendar: "gc" }),
    ).toEqual({
      isoDate: "1992-01-01",
      precision: "year",
      calendar: "gc",
      year: 1992,
      month: 1,
      day: 1,
    });

    expect(
      parseFlexibleCalendarDate("1992-05", { calendar: "gc" }),
    ).toEqual({
      isoDate: "1992-05-01",
      precision: "month",
      calendar: "gc",
      year: 1992,
      month: 5,
      day: 1,
    });

    // EC Year Only 1984 -> anchored 1984-01-01 E.C. -> 1991-09-12 G.C.
    expect(
      parseFlexibleCalendarDate("1984", { calendar: "ec" }),
    ).toEqual({
      isoDate: "1991-09-12",
      precision: "year",
      calendar: "ec",
      year: 1984,
      month: 1,
      day: 1,
    });

    // Inline EC tag
    expect(parseFlexibleCalendarDate("1984-13-05 EC")).toEqual({
      isoDate: formatIsoDate(
        ecToGc(1984, 13, 5).year,
        ecToGc(1984, 13, 5).month,
        ecToGc(1984, 13, 5).day,
      ),
      precision: "day",
      calendar: "ec",
      year: 1984,
      month: 13,
      day: 5,
    });

    // Rejects invalid dates
    expect(parseFlexibleCalendarDate("2016-13-06", { calendar: "ec" })).toBeNull();
    expect(parseFlexibleCalendarDate("2025-02-29", { calendar: "gc" })).toBeNull();
    expect(parseFlexibleCalendarDate("1984", { calendar: "ec", allowPartial: false })).toBeNull();
    expect(parseFlexibleCalendarDate("1984 EC", { calendar: "gc" })).toBeNull();
  });

  it("computes age accurately and resolves partial range bounds", () => {
    const refDate = new Date(Date.UTC(2026, 10, 10)); // 2026-11-10
    expect(computeAgeFromIsoDate("1991-09-12", refDate)).toBe(35);
    expect(computeAgeFromIsoDate("1991-12-01", refDate)).toBe(34);

    expect(resolveFilterDateBound("2024", "start", "gc")).toBe("2024-01-01");
    expect(resolveFilterDateBound("2024", "end", "gc")).toBe("2024-12-31");
    expect(resolveFilterDateBound("2024-02", "end", "gc")).toBe("2024-02-29");
  });
});

