import { ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorCode } from '../../constants/error-code.constant.js';
import { ErrorDetailDto } from './error-detail.dto.js';

export class ErrorDto {
  timestamp: string;
  statusCode: number;
  error: string;
  @ApiPropertyOptional({ enum: ErrorCode, enumName: 'ErrorCode' })
  errorCode?: ErrorCode;
  message: string;
  details?: ErrorDetailDto[];
}
