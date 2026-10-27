import { HttpStatus, Param, ParseUUIDPipe } from '@nestjs/common';

/** Id sai định dạng trả 404 như id không tồn tại, không tiết lộ thêm gì về định dạng. */
export const UUIDParam = (paramName: string) =>
  Param(
    paramName,
    new ParseUUIDPipe({
      version: '4',
      errorHttpStatusCode: HttpStatus.NOT_FOUND,
    }),
  );
