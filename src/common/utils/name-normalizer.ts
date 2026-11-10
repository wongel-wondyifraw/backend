const UPPER_LETTER_RE = /\p{Lu}/u;
const LOWER_LETTER_RE = /\p{Ll}/u;
const ANY_LETTER_RE = /\p{L}/u;
const ORDINAL_RE = /^\d+(st|nd|rd|th)$/i;
const ROMAN_NUMERAL_UPPER_RE = /^(II|III|IV|VI|VII|VIII|IX|XI|XII)$/;
const DOTTED_ACRONYM_RE = /^(\p{Lu}\.){2,}$/u;
const MIXED_DOTTED_ACRONYM_RE = /^(?:\p{Lu}\p{Ll}*\.)+$/u;
const DEGREE_ACRONYM_RE = /^(?:PhD|BSc|MSc|EdD|DMin|MDiv|ThM)$/;
const SCOTTISH_PREFIX_RE = /^[Mm]a?c\p{Lu}\p{Ll}{2,}$/u;

function hasCasing(char: string): boolean {
  return char.toLocaleLowerCase() !== char.toLocaleUpperCase();
}

function capitalizeFirstLetter(segment: string): string {
  const chars = Array.from(segment);
  const idx = chars.findIndex((c) => ANY_LETTER_RE.test(c));
  if (idx === -1) return segment;
  if (!hasCasing(chars[idx])) return segment;
  chars[idx] = chars[idx].toLocaleUpperCase();
  return chars.join("");
}

function normalizeFirstUpperRestLower(segment: string): string {
  const chars = Array.from(segment);
  let sawFirstLetter = false;
  return chars
    .map((ch) => {
      if (!ANY_LETTER_RE.test(ch) || !hasCasing(ch)) {
        return ch;
      }
      if (!sawFirstLetter) {
        sawFirstLetter = true;
        return ch.toLocaleUpperCase();
      }
      return ch.toLocaleLowerCase();
    })
    .join("");
}

function countCasedLetters(segment: string): number {
  return Array.from(segment).filter(
    (c) => ANY_LETTER_RE.test(c) && hasCasing(c),
  ).length;
}

function normalizeSegment(
  segment: string,
  options: { preserveShortAcronyms: boolean; isTrailingRoman?: boolean },
): string {
  if (!segment) return segment;

  // Keep ordinals like "1st", "2nd", "3rd", "4th" lowercase-suffixed
  if (ORDINAL_RE.test(segment)) {
    return segment.toLowerCase();
  }

  // Keep trailing intentional Roman numerals in person names like "John Doe III"
  if (options.isTrailingRoman && ROMAN_NUMERAL_UPPER_RE.test(segment)) {
    return segment;
  }

  const hasLower = LOWER_LETTER_RE.test(segment);
  const hasUpper = UPPER_LETTER_RE.test(segment);

  // Unicase scripts (Amharic/Ethiopic, Arabic, etc.) or digits/punctuation only
  if (!hasLower && !hasUpper) {
    return segment;
  }

  // Preserve short uppercase acronyms and dotted acronyms in title/org/location mode
  if (options.preserveShortAcronyms && !hasLower && hasUpper) {
    if (DOTTED_ACRONYM_RE.test(segment) || countCasedLetters(segment) <= 4) {
      return segment;
    }
  }

  // Mixed-case tokens: preserve genuine Scottish/Irish prefixes ("McDonald", "mcDonald", "MacArthur")
  // and, in title mode, standard academic/dotted degree tokens ("Ph.D.", "B.Sc.", "PhD", "MDiv").
  // Normalize all other erratic mixed-case inputs ("WONgel", "TesT", "wOnGeL", "jOHN", "YOUth", "paSTOR").
  if (hasLower && hasUpper) {
    if (SCOTTISH_PREFIX_RE.test(segment)) {
      return capitalizeFirstLetter(segment);
    }
    if (
      options.preserveShortAcronyms &&
      (MIXED_DOTTED_ACRONYM_RE.test(segment) ||
        DEGREE_ACRONYM_RE.test(segment))
    ) {
      return capitalizeFirstLetter(segment);
    }
    return normalizeFirstUpperRestLower(segment);
  }

  // Purely uppercase ("JOHN", "ABERA") or purely lowercase ("john")
  return normalizeFirstUpperRestLower(segment);
}

function normalizeWord(
  word: string,
  options: { preserveShortAcronyms: boolean; isLastWord: boolean; wordCount: number },
): string {
  if (!word) return word;
  const parts = word.split(/([-''’])/u);
  if (parts.length === 1) {
    return normalizeSegment(word, {
      preserveShortAcronyms: options.preserveShortAcronyms,
      isTrailingRoman: options.isLastWord && options.wordCount >= 2,
    });
  }

  let prevSegment = "";
  let prevDelimiter = "";
  return parts
    .map((part, idx) => {
      if (part === "-" || part === "'" || part === "’") {
        prevDelimiter = part;
        return part;
      }
      // Keep English possessive `'s` after a multi-letter name token lowercase ("Mark's")
      if (
        (prevDelimiter === "'" || prevDelimiter === "’") &&
        countCasedLetters(prevSegment) >= 2 &&
        part.toLocaleLowerCase() === "s" &&
        idx === parts.length - 1
      ) {
        return part.toLocaleLowerCase();
      }
      const normalized = normalizeSegment(part, {
        preserveShortAcronyms: options.preserveShortAcronyms,
      });
      if (part) {
        prevSegment = normalized;
      }
      return normalized;
    })
    .join("");
}

/**
 * Normalize a person's name so each word and hyphenated/apostrophed part
 * begins with a capital initial, correcting lowercase initials, caps-lock
 * inversions ("jOHN"), and full-caps entries ("JOHN DOE") while staying
 * safe for Ethiopic/Unicode scripts and mixed-case surnames ("McDonald").
 */
export function normalizePersonName(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, " ");
  if (!collapsed) return "";
  const words = collapsed.split(" ");
  return words
    .map((word, idx) =>
      normalizeWord(word, {
        preserveShortAcronyms: false,
        isLastWord: idx === words.length - 1,
        wordCount: words.length,
      }),
    )
    .join(" ");
}

/**
 * Normalize labels/organizations/locations/titles so lowercase initials are
 * capitalized while preserving short uppercase acronyms ("IT", "NGO", "USA").
 */
export function normalizeTitleInitials(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, " ");
  if (!collapsed) return "";
  const words = collapsed.split(" ");
  return words
    .map((word, idx) =>
      normalizeWord(word, {
        preserveShortAcronyms: true,
        isLastWord: idx === words.length - 1,
        wordCount: words.length,
      }),
    )
    .join(" ");
}
