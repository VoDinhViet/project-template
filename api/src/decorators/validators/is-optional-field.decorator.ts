import { ValidateIf } from 'class-validator';

/**
 * Khác `IsOptional()` của class-validator: `IsOptional` bỏ qua cả `null`, còn ở đây `null` chỉ được
 * bỏ qua khi field khai báo `nullable`, nếu không vẫn bị validator của field từ chối (422) thay vì
 * lọt xuống `.set({ name: null })` và thành lỗi DB.
 */
export function IsOptionalField(
  options: { nullable?: boolean } = {},
): PropertyDecorator {
  return ValidateIf(
    (_object, value) =>
      value !== undefined && !(value === null && options.nullable),
  );
}
