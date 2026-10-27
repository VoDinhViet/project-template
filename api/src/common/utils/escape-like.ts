/** Escape `%`, `_` và `\` để từ khoá người dùng nhập không thành ký tự đại diện của `LIKE`. */
export function escapeLike(keyword: string): string {
  return keyword.replace(/[\\%_]/g, (character) => `\\${character}`);
}
