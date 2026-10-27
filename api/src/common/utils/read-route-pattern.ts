import type { Request } from 'express';

/** Log mẫu route (`/invitations/:token`) thay cho URL thật vì đường dẫn có thể chứa token. */
export function readRoutePattern(request: Request): string {
  // Express khai báo `request.route` là `any`.
  const routePath = (request.route as { path?: string } | undefined)?.path;
  return routePath ?? '(route chưa khớp)';
}
