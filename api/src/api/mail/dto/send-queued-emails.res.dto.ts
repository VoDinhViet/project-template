import { Exclude, Expose } from 'class-transformer';
import { NumberField } from '../../../decorators/field.decorators.js';

@Exclude()
export class SendQueuedEmailsResDto {
  @Expose()
  @NumberField({ int: true, description: 'Số thư cron lấy ra xử lý lần này' })
  claimedCount!: number;

  @Expose()
  @NumberField({ int: true, description: 'Số thư gửi thành công lần này' })
  sentCount!: number;

  @Expose()
  @NumberField({
    int: true,
    description: 'Số thư gửi lỗi và được hẹn gửi lại',
  })
  retriedCount!: number;

  @Expose()
  @NumberField({
    int: true,
    description: 'Số thư hỏng hẳn (hết lượt gửi lại hoặc không giải mã được)',
  })
  failedCount!: number;

  @Expose()
  @NumberField({
    int: true,
    description:
      'Số thư bị huỷ vì lời mời đã đổi link, bị thu hồi, đã dùng hoặc hết hạn',
  })
  cancelledCount!: number;
}
