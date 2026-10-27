import { Exclude, Expose } from 'class-transformer';
import { EnumField } from '../../../decorators/field.decorators.js';

export enum DatabaseStatus {
  UP = 'UP',
  DOWN = 'DOWN',
}

@Exclude()
export class HealthResDto {
  @Expose()
  @EnumField(() => DatabaseStatus, {
    enumName: 'DatabaseStatus',
    description: 'Trạng thái kết nối tới MySQL/MariaDB',
  })
  db: DatabaseStatus;
}
