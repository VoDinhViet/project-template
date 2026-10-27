import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-code.constant.js';

/** Lỗi nghiệp vụ: `web` ánh xạ `errorCode` sang thông báo; `message` thường bỏ trống. */
export class AppException extends HttpException {
  constructor(
    readonly errorCode: ErrorCode,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    message?: string,
  ) {
    super(message ?? errorCode, status);
  }
}
