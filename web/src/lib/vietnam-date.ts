import { tz } from '@date-fns/tz'
import {
  addDays,
  format,
  getISODay,
  parse,
  parseISO,
  startOfISOWeek,
} from 'date-fns'

const DAYS_PER_WEEK = 7
const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

/**
 * Tiện ích ngày giờ theo múi giờ Việt Nam cho lịch, dùng chung giữa các feature.
 *
 * Rules:
 * - `dateKey` là `YYYY-MM-DD` theo giờ Việt Nam; cộng trừ ngày trên chính `dateKey` (không qua giờ)
 *   nên không lệch theo máy chạy.
 * - Đổi một mốc thời gian ra `dateKey` thì viết thẳng `format(date, 'yyyy-MM-dd', { in: tz('Asia/Ho_Chi_Minh') })`,
 *   không theo giờ của máy chạy (server UTC lệch 7 tiếng),.
 * - Tuần bắt đầu thứ Hai như lịch Việt Nam.
 */
/** Số phút tính từ 0 giờ (giờ Việt Nam), dùng để đặt khối lên lưới giờ. */
export function toVietnamMinuteOfDay(date: string | number): number {
  const vietnamTime = tz('Asia/Ho_Chi_Minh')(date)
  return vietnamTime.getHours() * 60 + vietnamTime.getMinutes()
}

/** Ghép ngày và giờ (`HH:mm`) giờ Việt Nam thành ISO UTC để lưu. */
export function toIsoDateTime(dateKey: string, time: string): string {
  // Chuỗi không có offset bị đọc theo giờ máy chạy, nên phải `parse` trong ngữ cảnh múi giờ Việt Nam.
  return new Date(
    parse(`${dateKey} ${time}`, 'yyyy-MM-dd HH:mm', new Date(), {
      in: tz('Asia/Ho_Chi_Minh'),
    }).getTime(),
  ).toISOString()
}

export function addDaysToKey(dateKey: string, dayCount: number): string {
  return format(addDays(parseISO(dateKey), dayCount), 'yyyy-MM-dd')
}

/** Thứ trong tuần, thứ Hai là 0. */
export function toWeekdayIndex(dateKey: string): number {
  return getISODay(parseISO(dateKey)) - 1
}

export function startOfWeekKey(dateKey: string): string {
  return format(startOfISOWeek(parseISO(dateKey)), 'yyyy-MM-dd')
}

export function toWeekDateKeys(weekStartKey: string): string[] {
  return Array.from({ length: DAYS_PER_WEEK }, (_, dayIndex) =>
    addDaysToKey(weekStartKey, dayIndex),
  )
}

/** "T2 27/10". */
export function formatDayLabel(dateKey: string): string {
  return `${weekdayLabels[toWeekdayIndex(dateKey)]} ${format(parseISO(dateKey), 'd/M')}`
}

/** "27/10 – 2/11/2026". */
export function formatWeekRange(weekStartKey: string): string {
  const weekStart = parseISO(weekStartKey)
  return `${format(weekStart, 'd/M')} – ${format(addDays(weekStart, DAYS_PER_WEEK - 1), 'd/M/yyyy')}`
}

/** "08:00–10:00". */
export function formatTimeRange(start: string, end: string): string {
  return `${format(start, 'HH:mm', { in: tz('Asia/Ho_Chi_Minh') })}–${format(end, 'HH:mm', { in: tz('Asia/Ho_Chi_Minh') })}`
}
