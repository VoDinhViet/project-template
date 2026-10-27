import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Bỏ qua các guard toàn cục cho một route (health, file có URL ký, cron có secret riêng). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
