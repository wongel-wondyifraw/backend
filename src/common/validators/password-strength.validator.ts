import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import zxcvbn from "zxcvbn";

@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    if (typeof password !== "string") return false;

    // NIST 800-63b requires minimum 8 characters
    if (password.length < 8) return false;

    // Complexity: uppercase, lowercase, digit
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasDigit) return false;

    // Reject easily guessable passwords (zxcvbn score < 2)
    const result = zxcvbn(password);
    if (result.score < 2) return false;

    return true;
  }

  defaultMessage(): string {
    return "Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and not be easily guessable.";
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}
