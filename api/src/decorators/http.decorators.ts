import {
  applyDecorators,
  HttpCode,
  HttpStatus,
  type Type,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorDto } from '../common/dto/error.dto.js';
import { Public } from './public.decorator.js';

interface ApiEndpointOptions {
  type?: Type<unknown>;
  summary?: string;
  description?: string;
  isPaginated?: boolean;
  isArray?: boolean;
  statusCode?: HttpStatus;
  errorResponses?: HttpStatus[];
}

const DEFAULT_AUTH_ERRORS = [
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
  HttpStatus.NOT_FOUND,
  HttpStatus.UNPROCESSABLE_ENTITY,
];
const DEFAULT_PUBLIC_ERRORS = [
  HttpStatus.NOT_FOUND,
  HttpStatus.UNPROCESSABLE_ENTITY,
];

function buildSuccessResponse(options: ApiEndpointOptions, status: HttpStatus) {
  const { type, description, isPaginated, isArray } = options;

  if (status === HttpStatus.NO_CONTENT) {
    return ApiNoContentResponse({ description });
  }

  const respond =
    status === HttpStatus.CREATED ? ApiCreatedResponse : ApiOkResponse;

  if (isPaginated && type) {
    // Dựng schema trực tiếp: Swagger coi `OffsetPaginatedDto<T>` (generic) là vòng phụ thuộc.
    return applyDecorators(
      ApiExtraModels(type),
      respond({
        description,
        schema: {
          type: 'object',
          required: ['data', 'pagination'],
          properties: {
            data: { type: 'array', items: { $ref: getSchemaPath(type) } },
            pagination: {
              type: 'object',
              required: ['limit', 'currentPage', 'totalRecords', 'totalPages'],
              properties: {
                limit: { type: 'integer' },
                currentPage: { type: 'integer' },
                nextPage: { type: 'integer' },
                previousPage: { type: 'integer' },
                totalRecords: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
      }),
    );
  }

  return respond({ description, type, isArray });
}

function buildEndpoint(
  options: ApiEndpointOptions,
  defaultErrors: HttpStatus[],
): MethodDecorator {
  const status = options.statusCode ?? HttpStatus.OK;
  const errorStatuses = options.errorResponses ?? defaultErrors;

  return applyDecorators(
    HttpCode(status),
    ApiOperation({ summary: options.summary }),
    buildSuccessResponse(options, status),
    ...errorStatuses.map((errorStatus) =>
      ApiResponse({ status: errorStatus, type: ErrorDto }),
    ),
  );
}

/** Route cần xác thực (mặc định của dự án). */
export const ApiAuth = (options: ApiEndpointOptions = {}) =>
  buildEndpoint(options, DEFAULT_AUTH_ERRORS);

/** Route công khai: bỏ qua guard toàn cục. */
export const ApiPublic = (options: ApiEndpointOptions = {}) =>
  applyDecorators(Public(), buildEndpoint(options, DEFAULT_PUBLIC_ERRORS));
