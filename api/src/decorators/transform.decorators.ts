import { Transform } from 'class-transformer';

export function ToBoolean(): PropertyDecorator {
  // Query string luôn là chữ, nên phải đổi 'true'/'false' sang boolean trước khi validate.
  return Transform(
    ({ value }: { value: unknown }) => {
      switch (value) {
        case 'true':
          return true;
        case 'false':
          return false;
        default:
          return value;
      }
    },
    { toClassOnly: true },
  );
}

// Phần tử sai kiểu giữ nguyên để validator trả 422 thay vì làm `transform` ném lỗi (500).
function mapStrings(
  value: unknown,
  convert: (text: string) => string,
): unknown {
  if (typeof value === 'string') {
    return convert(value);
  }
  if (Array.isArray(value)) {
    return (value as unknown[]).map((item) =>
      typeof item === 'string' ? convert(item) : item,
    );
  }
  return value;
}

export function Trim(): PropertyDecorator {
  return Transform(
    ({ value }: { value: unknown }) => mapStrings(value, (text) => text.trim()),
    { toClassOnly: true },
  );
}

export function ToLowerCase(): PropertyDecorator {
  return Transform(
    ({ value }: { value: unknown }) =>
      mapStrings(value, (text) => text.toLowerCase()),
    { toClassOnly: true },
  );
}

export function ToUpperCase(): PropertyDecorator {
  return Transform(
    ({ value }: { value: unknown }) =>
      mapStrings(value, (text) => text.toUpperCase()),
    { toClassOnly: true },
  );
}
