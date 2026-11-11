import { Transform, type TransformFnParams } from "class-transformer";
import {
  normalizePersonName,
  normalizeTitleInitials,
} from "../utils/name-normalizer";

/**
 * Class-transformer decorator normalizing person names ("john doe" -> "John Doe").
 * Passes non-string values through unchanged so class-validator reports type errors.
 */
export function NormalizePersonName(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => {
    if (typeof value !== "string") return value;
    return normalizePersonName(value);
  });
}

/**
 * Class-transformer decorator normalizing titles, organizations, and location names
 * ("addis ababa" -> "Addis Ababa", preserving short uppercase acronyms like "IT").
 */
export function NormalizeTitleInitials(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => {
    if (typeof value !== "string") return value;
    return normalizeTitleInitials(value);
  });
}

