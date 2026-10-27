import { Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiPublic } from '../../decorators/http.decorators.js';
import { CronSecretGuard } from '../auth/guards/cron-secret.guard.js';
import { SendQueuedEmailsResDto } from '../mail/dto/send-queued-emails.res.dto.js';
import { EmailOutboxService } from '../mail/email-outbox.service.js';

@ApiTags('Cron')
// Route công khai nên `X-Client-IP` giả được; `CronSecretGuard` tự giới hạn số lần sai secret.
@SkipThrottle({ ip: true, user: true })
@Controller('cron')
export class CronController {
  constructor(private readonly emailOutboxService: EmailOutboxService) {}

  @Post('send-emails')
  @UseGuards(CronSecretGuard)
  @ApiPublic({
    type: SendQueuedEmailsResDto,
    errorResponses: [
      HttpStatus.UNAUTHORIZED,
      HttpStatus.NOT_FOUND,
      HttpStatus.TOO_MANY_REQUESTS,
    ],
    summary:
      'Cho cPanel Cron gọi mỗi 5 phút: gửi lại các email lỗi đã tới hạn (header X-Cron-Secret); 404 khi chưa cấu hình CRON_SECRET, 429 khi sai secret quá nhiều',
  })
  sendEmails(): Promise<SendQueuedEmailsResDto> {
    return this.emailOutboxService.sendQueuedEmails();
  }
}
