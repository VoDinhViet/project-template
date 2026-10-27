import { Exclude, Expose } from 'class-transformer';
import { StringField } from '../../../decorators/field.decorators.js';

@Exclude()
export class InvitationTokenResDto {
  @Expose()
  @StringField({ description: 'Token mới của link mời, chỉ trả một lần' })
  token!: string;
}
