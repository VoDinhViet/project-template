import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsDefined,
  IsEmail,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  ToBoolean,
  ToLowerCase,
  ToUpperCase,
  Trim,
} from './transform.decorators.js';
import { IsNullable } from './validators/is-nullable.decorator.js';
import { IsOptionalField } from './validators/is-optional-field.decorator.js';

/**
 * Decorator cho field của DTO: mỗi cái tự gói `Type()`, validator, `ApiProperty` và cách xử lý `null`;
 * bản `*Optional` là `IsOptionalField` cộng bản thường với `required: false`.
 *
 * Rules:
 * - Field của request chỉ dùng các decorator này, không dùng class-validator thô trong DTO.
 * - Cần kiểu field mới thì thêm vào file này.
 * - `each: true` ép giá trị phải là mảng (class-validator `each` chấp nhận cả giá trị đơn).
 */

export interface IFieldOptions {
  description?: string;
  nullable?: boolean;
  each?: boolean;
  required?: boolean;
}

export interface INumberFieldOptions extends IFieldOptions {
  min?: number;
  max?: number;
  int?: boolean;
  isPositive?: boolean;
}

export interface IStringFieldOptions extends IFieldOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
  trim?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
  maxItems?: number;
}

export interface IEnumFieldOptions extends IFieldOptions {
  // Tên schema enum trong OpenAPI; bắt buộc để Swagger đặt tên schema gọn thay vì tên tự đặt.
  enumName: string;
}

export interface IUUIDFieldOptions extends IFieldOptions {
  maxItems?: number;
}

export interface IEmailFieldOptions extends IFieldOptions {
  minItems?: number;
  maxItems?: number;
}

export interface IClassFieldOptions extends IFieldOptions {
  minItems?: number;
  maxItems?: number;
}

const DEFAULT_MIN_STRING_LENGTH = 1;
// Khớp độ dài cột `email` trong DB.
const MAX_EMAIL_LENGTH = 255;
const EMAIL_SAFE_PATTERN = /^[^"\s,;<>()\\]+@[^"\s,;<>()\\]+$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function NumberField(
  options: INumberFieldOptions = {},
): PropertyDecorator {
  const decorators: PropertyDecorator[] = [
    Type(() => Number),
    options.int
      ? IsInt({ each: options.each })
      : IsNumber({}, { each: options.each }),
  ];

  if (options.min !== undefined) {
    decorators.push(Min(options.min, { each: options.each }));
  }
  if (options.max !== undefined) {
    decorators.push(Max(options.max, { each: options.each }));
  }
  if (options.isPositive) {
    decorators.push(IsPositive({ each: options.each }));
  }
  if (options.each) {
    decorators.push(IsArray());
  }
  if (options.nullable) {
    decorators.push(IsNullable());
  }

  decorators.push(
    ApiProperty({
      type: Number,
      required: options.required !== false,
      description: options.description,
      nullable: options.nullable,
      isArray: options.each,
      minimum: options.min,
      maximum: options.max,
    }),
  );

  return applyDecorators(...decorators);
}

export function NumberFieldOptional(
  options: INumberFieldOptions = {},
): PropertyDecorator {
  return applyDecorators(
    IsOptionalField(options),
    NumberField({ ...options, required: false }),
  );
}

export function StringField(
  options: IStringFieldOptions = {},
): PropertyDecorator {
  const decorators: PropertyDecorator[] = [
    Type(() => String),
    IsString({ each: options.each }),
    MinLength(options.minLength ?? DEFAULT_MIN_STRING_LENGTH, {
      each: options.each,
    }),
  ];

  if (options.maxLength !== undefined) {
    decorators.push(MaxLength(options.maxLength, { each: options.each }));
  }
  if (options.pattern) {
    decorators.push(
      Matches(options.pattern, {
        each: options.each,
        message: options.patternMessage,
      }),
    );
  }
  // Cắt khoảng trắng đầu/cuối trước khi validate: chuỗi toàn khoảng trắng thành rỗng và bị `MinLength`
  // chặn. Mật khẩu hay giá trị cần giữ nguyên thì truyền `trim: false`.
  if (options.trim !== false) {
    decorators.push(Trim());
  }
  if (options.toLowerCase) {
    decorators.push(ToLowerCase());
  }
  if (options.toUpperCase) {
    decorators.push(ToUpperCase());
  }
  if (options.maxItems !== undefined) {
    decorators.push(ArrayMaxSize(options.maxItems));
  }
  if (options.each) {
    decorators.push(IsArray());
  }
  if (options.nullable) {
    decorators.push(IsNullable());
  }

  decorators.push(
    ApiProperty({
      type: String,
      required: options.required !== false,
      description: options.description,
      nullable: options.nullable,
      isArray: options.each,
      minLength: options.minLength,
      maxLength: options.maxLength,
      maxItems: options.maxItems,
    }),
  );

  return applyDecorators(...decorators);
}

export function StringFieldOptional(
  options: IStringFieldOptions = {},
): PropertyDecorator {
  return applyDecorators(
    IsOptionalField(options),
    StringField({ ...options, required: false }),
  );
}

export function BooleanField(options: IFieldOptions = {}): PropertyDecorator {
  const decorators: PropertyDecorator[] = [
    ToBoolean(),
    IsBoolean({ each: options.each }),
  ];

  if (options.each) {
    decorators.push(IsArray());
  }
  if (options.nullable) {
    decorators.push(IsNullable());
  }

  decorators.push(
    ApiProperty({
      type: Boolean,
      required: options.required !== false,
      description: options.description,
      nullable: options.nullable,
      isArray: options.each,
    }),
  );

  return applyDecorators(...decorators);
}

export function BooleanFieldOptional(
  options: IFieldOptions = {},
): PropertyDecorator {
  return applyDecorators(
    IsOptionalField(options),
    BooleanField({ ...options, required: false }),
  );
}

export function EnumField<TEnum extends object>(
  getEnum: () => TEnum,
  options: IEnumFieldOptions,
): PropertyDecorator {
  const decorators: PropertyDecorator[] = [
    IsEnum(getEnum(), { each: options.each }),
  ];

  if (options.each) {
    decorators.push(IsArray());
  }
  if (options.nullable) {
    decorators.push(IsNullable());
  }

  decorators.push(
    ApiProperty({
      enum: getEnum(),
      enumName: options.enumName,
      required: options.required !== false,
      description: options.description,
      nullable: options.nullable,
      isArray: options.each,
    }),
  );

  return applyDecorators(...decorators);
}

export function EnumFieldOptional<TEnum extends object>(
  getEnum: () => TEnum,
  options: IEnumFieldOptions,
): PropertyDecorator {
  return applyDecorators(
    IsOptionalField(options),
    EnumField(getEnum, { ...options, required: false }),
  );
}

export function UUIDField(options: IUUIDFieldOptions = {}): PropertyDecorator {
  const decorators: PropertyDecorator[] = [IsUUID('4', { each: options.each })];

  if (options.maxItems !== undefined) {
    decorators.push(ArrayMaxSize(options.maxItems));
  }
  if (options.each) {
    decorators.push(IsArray());
  }
  if (options.nullable) {
    decorators.push(IsNullable());
  }

  decorators.push(
    ApiProperty({
      type: String,
      format: 'uuid',
      required: options.required !== false,
      description: options.description,
      nullable: options.nullable,
      isArray: options.each,
      maxItems: options.maxItems,
    }),
  );

  return applyDecorators(...decorators);
}

export function UUIDFieldOptional(
  options: IUUIDFieldOptions = {},
): PropertyDecorator {
  return applyDecorators(
    IsOptionalField(options),
    UUIDField({ ...options, required: false }),
  );
}

export function DateField(options: IFieldOptions = {}): PropertyDecorator {
  const decorators: PropertyDecorator[] = [
    Type(() => Date),
    IsDate({ each: options.each }),
  ];

  if (options.each) {
    decorators.push(IsArray());
  }
  if (options.nullable) {
    decorators.push(IsNullable());
  }

  decorators.push(
    ApiProperty({
      type: Date,
      required: options.required !== false,
      description: options.description,
      nullable: options.nullable,
      isArray: options.each,
    }),
  );

  return applyDecorators(...decorators);
}

export function DateFieldOptional(
  options: IFieldOptions = {},
): PropertyDecorator {
  return applyDecorators(
    IsOptionalField(options),
    DateField({ ...options, required: false }),
  );
}

/** Chỉ ngày `YYYY-MM-DD` theo giờ Việt Nam, khớp cột `date` mode `string`. */
export function DateOnlyField(options: IFieldOptions = {}): PropertyDecorator {
  const decorators: PropertyDecorator[] = [
    Type(() => String),
    IsString({ each: options.each }),
    Matches(DATE_ONLY_PATTERN, {
      each: options.each,
      message: 'Ngày phải có dạng YYYY-MM-DD',
    }),
    // Chuỗi `2026-02-31` khớp mẫu nhưng không phải ngày thật; `strict` loại nó trước khi tới MySQL.
    IsISO8601({ strict: true }, { each: options.each }),
  ];

  if (options.each) {
    decorators.push(IsArray());
  }
  if (options.nullable) {
    decorators.push(IsNullable());
  }

  decorators.push(
    ApiProperty({
      type: String,
      format: 'date',
      example: '2026-10-23',
      required: options.required !== false,
      description: options.description,
      nullable: options.nullable,
      isArray: options.each,
    }),
  );

  return applyDecorators(...decorators);
}

export function DateOnlyFieldOptional(
  options: IFieldOptions = {},
): PropertyDecorator {
  return applyDecorators(
    IsOptionalField(options),
    DateOnlyField({ ...options, required: false }),
  );
}

export function EmailField(
  options: IEmailFieldOptions = {},
): PropertyDecorator {
  const decorators: PropertyDecorator[] = [
    Trim(),
    ToLowerCase(),
    IsEmail({}, { each: options.each }),
    // `IsEmail` nhận cả dạng có nháy như `"a@evil.com"@x.com`, nơi nhận thư có thể hiểu thành hộp thư khác.
    Matches(EMAIL_SAFE_PATTERN, { each: options.each }),
    MaxLength(MAX_EMAIL_LENGTH, { each: options.each }),
  ];

  if (options.minItems !== undefined) {
    decorators.push(ArrayMinSize(options.minItems));
  }
  if (options.maxItems !== undefined) {
    decorators.push(ArrayMaxSize(options.maxItems));
  }
  if (options.each) {
    decorators.push(IsArray());
  }
  if (options.nullable) {
    decorators.push(IsNullable());
  }

  decorators.push(
    ApiProperty({
      type: String,
      format: 'email',
      required: options.required !== false,
      description: options.description,
      nullable: options.nullable,
      isArray: options.each,
      maxLength: MAX_EMAIL_LENGTH,
      minItems: options.minItems,
      maxItems: options.maxItems,
    }),
  );

  return applyDecorators(...decorators);
}

export function EmailFieldOptional(
  options: IEmailFieldOptions = {},
): PropertyDecorator {
  return applyDecorators(
    IsOptionalField(options),
    EmailField({ ...options, required: false }),
  );
}

export function ClassField<TClass extends object>(
  getClass: () => new () => TClass,
  options: IClassFieldOptions = {},
): PropertyDecorator {
  const decorators: PropertyDecorator[] = [
    Type(getClass),
    ValidateNested({ each: options.each }),
  ];

  // `ValidateNested` bỏ qua `undefined`, nên field bắt buộc phải thêm `IsDefined`.
  if (options.required !== false) {
    decorators.push(IsDefined());
  }
  if (options.minItems !== undefined) {
    decorators.push(ArrayMinSize(options.minItems));
  }
  if (options.maxItems !== undefined) {
    decorators.push(ArrayMaxSize(options.maxItems));
  }
  if (options.each) {
    decorators.push(IsArray());
  }
  if (options.nullable) {
    decorators.push(IsNullable());
  }

  decorators.push(
    ApiProperty({
      type: () => getClass(),
      required: options.required !== false,
      description: options.description,
      nullable: options.nullable,
      isArray: options.each,
    }),
  );

  return applyDecorators(...decorators);
}

export function ClassFieldOptional<TClass extends object>(
  getClass: () => new () => TClass,
  options: IClassFieldOptions = {},
): PropertyDecorator {
  return applyDecorators(
    IsOptionalField(options),
    ClassField(getClass, { ...options, required: false }),
  );
}
