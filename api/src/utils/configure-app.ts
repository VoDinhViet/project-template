import type { INestApplication } from '@nestjs/common';
import { API_PREFIX } from '../constants/app.constant.js';

// Health cũng nằm dưới prefix: trên hosting `api` chỉ nhận `/api/*` của tên miền chung với `web`.
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
}
