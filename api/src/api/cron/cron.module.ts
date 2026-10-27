import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module.js';
import { CronController } from './cron.controller.js';

@Module({
  imports: [MailModule],
  controllers: [CronController],
})
export class CronModule {}
