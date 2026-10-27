import { Exclude, Expose } from 'class-transformer';
import {
  NumberField,
  StringField,
} from '../../../decorators/field.decorators.js';

@Exclude()
export class SessionResDto {
  @Expose()
  @StringField({ description: 'Session cookie để BFF lưu vào cookie httpOnly' })
  sessionCookie: string;

  @Expose()
  @NumberField({ int: true, description: 'Thời gian sống của cookie (ms)' })
  expiresInMs: number;
}
