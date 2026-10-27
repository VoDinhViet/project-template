export const MYSQL_ERRNO = {
  DUPLICATE_ENTRY: 1062,
  ROW_IS_REFERENCED: 1451,
  NO_REFERENCED_ROW: 1452,
  DEADLOCK: 1213,
} as const;

const MAX_CAUSE_DEPTH = 5;

export interface MysqlErrorInfo {
  errno: number;
  code: string;
}

/** Drizzle bọc lỗi driver trong `cause`, nên phải lần theo chuỗi `cause` để tìm lỗi mysql2. */
export function extractMysqlError(error: unknown): MysqlErrorInfo | null {
  let current: unknown = error;

  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth += 1) {
    if (!(current instanceof Error)) {
      return null;
    }
    const { errno, code } = current as { errno?: unknown; code?: unknown };
    if (typeof errno === 'number' && typeof code === 'string') {
      return { errno, code };
    }
    current = current.cause;
  }
  return null;
}
