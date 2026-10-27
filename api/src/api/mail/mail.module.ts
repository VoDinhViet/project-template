import { Module } from '@nestjs/common';
import { EmailOutboxService } from './email-outbox.service.js';
import { MailService } from './mail.service.js';

@Module({
  providers: [MailService, EmailOutboxService],
  exports: [EmailOutboxService],
})
export class MailModule {}
