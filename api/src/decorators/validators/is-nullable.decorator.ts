import { ValidateIf, type ValidationOptions } from 'class-validator';

/** Field khai báo `nullable`: `null` được chấp nhận, bỏ qua mọi validator còn lại. */
export function IsNullable(options?: ValidationOptions): PropertyDecorator {
  return ValidateIf((_object, value) => value !== null, options);
}
