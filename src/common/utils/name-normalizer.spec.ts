import {
  normalizePersonName,
  normalizeTitleInitials,
} from "./name-normalizer";

describe("name-normalizer", () => {
  describe("normalizePersonName", () => {
    it("capitalizes lowercase initials and collapses spaces", () => {
      expect(normalizePersonName("  john   doe  ")).toBe("John Doe");
      expect(normalizePersonName("abel tesfaye gebre")).toBe(
        "Abel Tesfaye Gebre",
      );
      expect(normalizePersonName("a")).toBe("A");
    });

    it("normalizes ALL CAPS, caps-lock inversions, and arbitrary mixed-case inputs", () => {
      expect(normalizePersonName("JOHN MICHAEL DOE")).toBe("John Michael Doe");
      expect(normalizePersonName("jOHN dOE")).toBe("John Doe");
      expect(normalizePersonName("dAWIT")).toBe("Dawit");
      expect(normalizePersonName("ABebe JOhn")).toBe("Abebe John");
      expect(normalizePersonName("WONgel TesT")).toBe("Wongel Test");
      expect(normalizePersonName("wOnGeL tEsT")).toBe("Wongel Test");
      expect(normalizePersonName("o'CONnor-sMiTh")).toBe("O'Connor-Smith");
    });

    it("handles hyphenated and apostrophed names cleanly", () => {
      expect(normalizePersonName("anne-marie")).toBe("Anne-Marie");
      expect(normalizePersonName("o'connor")).toBe("O'Connor");
      expect(normalizePersonName("d’angelo")).toBe("D’Angelo");
      expect(normalizePersonName("mark's")).toBe("Mark's");
    });

    it("preserves intentional mixed-case surnames and trailing Roman numerals", () => {
      expect(normalizePersonName("mcDonald")).toBe("McDonald");
      expect(normalizePersonName("McDonald")).toBe("McDonald");
      expect(normalizePersonName("MacArthur")).toBe("MacArthur");
      expect(normalizePersonName("MCDonald")).toBe("Mcdonald");
      expect(normalizePersonName("john doe III")).toBe("John Doe III");
    });

    it("leaves Ethiopic/Amharic and unicase Unicode characters intact", () => {
      expect(normalizePersonName("  ዳዊት   ተስፋዬ ")).toBe("ዳዊት ተስፋዬ");
      expect(normalizePersonName("ዩሐንስ")).toBe("ዩሐንስ");
    });

    it("handles blank strings", () => {
      expect(normalizePersonName("   ")).toBe("");
    });
  });

  describe("normalizeTitleInitials", () => {
    it("capitalizes lowercase and mixed-case inputs while preserving short uppercase and degree acronyms", () => {
      expect(normalizeTitleInitials("addis ababa central")).toBe(
        "Addis Ababa Central",
      );
      expect(normalizeTitleInitials("IT department head")).toBe(
        "IT Department Head",
      );
      expect(normalizeTitleInitials("NGO coordinator")).toBe("NGO Coordinator");
      expect(normalizeTitleInitials("1st youth choir")).toBe("1st Youth Choir");
      expect(normalizeTitleInitials("YOUth paSTOR")).toBe("Youth Pastor");
      expect(normalizeTitleInitials("WONgel TesT")).toBe("Wongel Test");
      expect(normalizeTitleInitials("Ph.D. cOunselor")).toBe("Ph.D. Counselor");
      expect(normalizeTitleInitials("PhD candidate")).toBe("PhD Candidate");
    });
  });
});
