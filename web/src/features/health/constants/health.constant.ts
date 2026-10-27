import type { DatabaseStatus } from '../types/health.type'

export const HEALTH_POLL_INTERVAL_MS = 30_000

export const databaseStatusLabels: Record<DatabaseStatus, string> = {
  UP: 'Đang hoạt động',
  DOWN: 'Mất kết nối',
}
