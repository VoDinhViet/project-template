import { STATUS_CODES } from 'node:http';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import type { ErrorDetailDto } from '../common/dto/error-detail.dto.js';
import type { ErrorDto } from '../common/dto/error.dto.js';
import {
  extractMysqlError,
  MYSQL_ERRNO,
  type MysqlErrorInfo,
} from '../common/utils/extract-mysql-error.js';
import { ErrorCode } from '../constants/error-code.constant.js';
import { AppException } from '../exceptions/app.exception.js';

const VALIDATION_FAILED_MESSAGE = 'Validation failed';
const INTERNAL_ERROR_MESSAGE = 'Internal server error';
const EMPTY_UPDATE_MESSAGE = 'Không có trường hợp lệ nào để cập nhật.';
const FILE_NOT_FOUND_MESSAGE = 'Không tìm thấy tệp.';
// Drizzle ném đúng chuỗi này khi `.set({})` nhận payload rỗng.
const DRIZZLE_EMPTY_SET_MESSAGE = 'No values to set';
const FILE_PATH_LEAK_PATTERN = /ENOENT|no such file or directory/i;

function isValidationError(value: unknown): value is ValidationError {
  return typeof value === 'object' && value !== null && 'property' in value;
}

function flattenValidationErrors(
  validationErrors: ValidationError[],
  parentPath = '',
): ErrorDetailDto[] {
  return validationErrors.flatMap((validationError) => {
    const property = parentPath
      ? `${parentPath}.${validationError.property}`
      : validationError.property;
    const ownDetails = Object.entries(validationError.constraints ?? {}).map(
      ([code, message]) => ({ property, code, message }),
    );
    const childDetails = flattenValidationErrors(
      validationError.children ?? [],
      property,
    );
    return [...ownDetails, ...childDetails];
  });
}

// `body-parser` ném lỗi 413 của `http-errors` chứ không phải `HttpException`, nên nếu không bắt riêng
// thì body quá giới hạn rơi xuống 500 và ghi stack vào log.
function isPayloadTooLarge(exception: unknown): boolean {
  const { status } = (exception ?? {}) as { status?: unknown };
  return status === HttpStatus.PAYLOAD_TOO_LARGE;
}

/** Ánh xạ mọi lỗi sang `ErrorDto` của REST. */
export function toErrorDto(exception: unknown): ErrorDto {
  if (exception instanceof AppException) {
    return build(exception.getStatus(), {
      errorCode: exception.errorCode,
      message: exception.message,
    });
  }
  if (
    exception instanceof UnprocessableEntityException ||
    exception instanceof BadRequestException
  ) {
    return handleValidationException(exception);
  }
  if (isPayloadTooLarge(exception)) {
    return build(HttpStatus.PAYLOAD_TOO_LARGE, {
      errorCode: ErrorCode.E007,
      message: ErrorCode.E007,
    });
  }
  if (exception instanceof HttpException) {
    return handleHttpException(exception);
  }

  const mysqlError = extractMysqlError(exception);
  if (mysqlError) {
    return handleDatabaseError(mysqlError);
  }
  return handleError(exception);
}

function handleValidationException(
  exception: UnprocessableEntityException | BadRequestException,
): ErrorDto {
  const { message } = exception.getResponse() as { message?: unknown };
  const messages = Array.isArray(message) ? (message as unknown[]) : [];

  const details = messages.every(isValidationError)
    ? flattenValidationErrors(messages)
    : messages.map((text) => ({
        property: 'validation',
        code: 'invalid',
        message: String(text),
      }));

  return build(exception.getStatus(), {
    errorCode: ErrorCode.V001,
    message: VALIDATION_FAILED_MESSAGE,
    details,
  });
}

function handleHttpException(exception: HttpException): ErrorDto {
  const exceptionResponse = exception.getResponse();
  const responseMessage =
    typeof exceptionResponse === 'string'
      ? exceptionResponse
      : (exceptionResponse as { message?: string | string[] }).message;
  const message = Array.isArray(responseMessage)
    ? responseMessage.join('; ')
    : (responseMessage ?? exception.message);
  // `express.static` ném lỗi kèm nguyên văn đường dẫn đĩa khi thiếu file (`ENOENT: ... open '/...'`).
  return build(exception.getStatus(), {
    message: FILE_PATH_LEAK_PATTERN.test(message)
      ? FILE_NOT_FOUND_MESSAGE
      : message,
  });
}

function handleDatabaseError(mysqlError: MysqlErrorInfo): ErrorDto {
  switch (mysqlError.errno) {
    case MYSQL_ERRNO.DUPLICATE_ENTRY:
      return build(HttpStatus.CONFLICT, {
        errorCode: ErrorCode.E003,
        message: ErrorCode.E003,
      });
    case MYSQL_ERRNO.ROW_IS_REFERENCED:
    case MYSQL_ERRNO.NO_REFERENCED_ROW:
      return build(HttpStatus.BAD_REQUEST, {
        errorCode: ErrorCode.E004,
        message: ErrorCode.E004,
      });
    // Hai thao tác khoá cùng vai trò/lời mời theo thứ tự ngược nhau: InnoDB huỷ một bên, người dùng
    // thử lại là được.
    case MYSQL_ERRNO.DEADLOCK:
      return build(HttpStatus.CONFLICT, {
        errorCode: ErrorCode.E024,
        message: ErrorCode.E024,
      });
    default:
      return internalError();
  }
}

function handleError(exception: unknown): ErrorDto {
  // `ValidationPipe` whitelist có thể loại sạch field của một `PATCH`, nên đây là lỗi input chứ không phải 500.
  if (
    exception instanceof Error &&
    exception.message === DRIZZLE_EMPTY_SET_MESSAGE
  ) {
    return build(HttpStatus.BAD_REQUEST, {
      errorCode: ErrorCode.V002,
      message: EMPTY_UPDATE_MESSAGE,
    });
  }
  return internalError();
}

// Không đưa `exception.message` ra response vì có thể chứa SQL hoặc đường dẫn; chi tiết nằm ở log.
function internalError(): ErrorDto {
  return build(HttpStatus.INTERNAL_SERVER_ERROR, {
    errorCode: ErrorCode.E001,
    message: INTERNAL_ERROR_MESSAGE,
  });
}

function build(
  statusCode: number,
  fields: Pick<ErrorDto, 'message'> & Partial<ErrorDto>,
): ErrorDto {
  return {
    timestamp: new Date().toISOString(),
    statusCode,
    error: STATUS_CODES[statusCode] ?? 'Error',
    ...fields,
  };
}
