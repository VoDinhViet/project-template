import type { JSONContent } from '@tiptap/react'

/** Khớp `ALLOWED_LINK_PATTERN` của `api`; giao thức khác (`javascript:`, `data:`) không thành liên kết. */
export const RICH_TEXT_LINK_PATTERN = /^(https?:|mailto:)/i

/**
 * Đọc nội dung đã lưu thành tài liệu Tiptap.
 *
 * Rules:
 * - Dữ liệu cũ chỉ là text thuần (mỗi dòng một đoạn), nên chuỗi không phải JSON `doc` được tách theo dòng.
 * - Chuỗi rỗng ra tài liệu một đoạn trống, đúng trạng thái ban đầu của editor.
 */
export function parseRichText(value: string): JSONContent {
  try {
    const document: unknown = JSON.parse(value)
    if (
      typeof document === 'object' &&
      document !== null &&
      'type' in document &&
      document.type === 'doc' &&
      (!('content' in document) || Array.isArray(document.content))
    ) {
      return document as JSONContent // đã kiểm `type: 'doc'`; `api` chặn node/mark lạ khi lưu
    }
  } catch {
    // Không phải JSON: rơi xuống nhánh text thuần.
  }
  return {
    type: 'doc',
    content: value.split(/\r?\n/).map((line) => ({
      type: 'paragraph',
      content: line === '' ? undefined : [{ type: 'text', text: line }],
    })),
  }
}
