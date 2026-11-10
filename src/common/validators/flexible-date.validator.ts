import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from "class-validator";
import { parseFlexibleCalendarDate } from "../utils/ethiopian-calendar";

export interface FlexibleDateOptions {
  /** Allow partial values ("YYYY" and "YYYY-MM") in addition to "YYYY-MM-DD". Default: true. */
  allowPartial?: boolean;
  /** Name of the sibling property containing 'gc' | 'ec'. Defaults to `${propertyName}_calendar`. */
  calendarField?: string;
  /** Name of the sibling property containing precision override. Defaults to `${propertyName}_precision`. */
  precisionField?: string;
}

@ValidatorConstraint({ name: "isFlexibleDate", async: false })
export class IsFlexibleDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (value === null || value === undefined || value === "") {
      // Presence checks are handled by @IsNotEmpty() when required
      return true;
    }
    if (typeof value !== "string") {
      return false;
    }

    const opts = (args.constraints[0] ?? {}) as FlexibleDateOptions;
    const obj = (args.object ?? {}) as Record<string, unknown>;
    const calendarKey = opts.calendarField ?? `${args.property}_calendar`;
    const precisionKey = opts.precisionField ?? `${args.property}_precision`;

    const rawCal = obj[calendarKey];
    if (rawCal !== undefined && rawCal !== null && rawCal !== "gc" && rawCal !== "ec") {
      return false;
    }

    const rawPrecision = obj[precisionKey];
    if (
      rawPrecision !== undefined &&
      rawPrecision !== null &&
      rawPrecision !== "day" &&
      rawPrecision !== "month" &&
      rawPrecision !== "year"
    ) {
      return false;
    }

    const parsed = parseFlexibleCalendarDate(value, {
      calendar: rawCal ?? null,
      precision: rawPrecision ?? null,
      allowPartial: opts.allowPartial ?? true,
    });
    return parsed !== null;
  }

  defaultMessage(args: ValidationArguments): string {
    const opts = (args.constraints[0] ?? {}) as FlexibleDateOptions;
    if (opts.allowPartial === false) {
      return `${args.property} must be a valid exact date (YYYY-MM-DD) in the selected calendar`;
    }
    return `${args.property} must be a valid year (YYYY), month (YYYY-MM), or date (YYYY-MM-DD) in the selected calendar`;
  }
}

export function IsFlexibleDate(
  options: FlexibleDateOptions = {},
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      target: target.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      constraints: [options],
      validator: IsFlexibleDateConstraint,
    });
  };
}
