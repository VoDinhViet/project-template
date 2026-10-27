/** Drizzle ném "No values to set" khi `.set()` nhận object rỗng, nên phải kiểm trước. */
export function hasFields(reqDto: object): boolean {
  return Object.values(reqDto).some((value) => value !== undefined);
}
