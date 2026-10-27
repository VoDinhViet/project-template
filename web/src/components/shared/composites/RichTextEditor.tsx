import { EditorContent, useEditor } from '@tiptap/react'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Placeholder } from '@tiptap/extensions'
import StarterKit from '@tiptap/starter-kit'
import { useMemo, useState } from 'react'
import { RICH_TEXT_LINK_PATTERN, parseRichText } from '@/lib/rich-text'
import { cn } from '@/lib/utils'
import { RichTextToolbar } from './RichTextToolbar'

type RichTextEditorProps = {
  /** Tên cho trình đọc màn hình; ô là `div` contenteditable nên `FieldLabel htmlFor` không gắn được. */
  'aria-label': string
  /** Chỉ dùng làm nội dung ban đầu; muốn nạp giá trị khác thì mount lại editor (đổi `key`). */
  value: string
  /** Trả chuỗi JSON của tài liệu, hoặc `''` khi không có chữ nào để "rỗng" đúng nghĩa với `api`. */
  onChange: (value: string) => void
  onBlur?: () => void
  /** Chỉ đọc lúc mount. */
  placeholder?: string
  autoFocus?: boolean
  'aria-invalid'?: boolean
  /** Chiều cao vùng gõ, ví dụ `min-h-32 max-h-72`. */
  className?: string
}

/** Soạn thảo văn bản định dạng như Jira; nội dung lưu dạng JSON của Tiptap, hiển thị lại bằng `RichTextContent`. */
export function RichTextEditor({
  'aria-label': ariaLabel,
  value,
  onChange,
  onBlur,
  placeholder,
  autoFocus,
  'aria-invalid': isInvalid,
  className,
}: RichTextEditorProps) {
  const [initialContent] = useState(() => parseRichText(value))
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          isAllowedUri: (url) => RICH_TEXT_LINK_PATTERN.test(url),
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
    ],
    [placeholder],
  )
  const editor = useEditor({
    // Tránh lệch HTML giữa server và client; trong lúc chờ hiện khung trống cùng kích thước.
    immediatelyRender: false,
    autofocus: autoFocus ? 'end' : false,
    extensions,
    content: initialContent,
    editorProps: {
      attributes: {
        class: cn('rich-text min-h-24 overflow-y-auto px-3 py-2', className),
        'aria-label': ariaLabel,
        'aria-multiline': 'true',
        ...(isInvalid ? { 'aria-invalid': 'true' } : {}),
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      // `isEmpty` không tính đoạn chỉ có khoảng trắng hay xuống dòng; đường kẻ ngang không có chữ nhưng vẫn là nội dung.
      const isBlank =
        updatedEditor.getText().trim() === '' &&
        !JSON.stringify(updatedEditor.getJSON()).includes('"horizontalRule"')
      onChange(isBlank ? '' : JSON.stringify(updatedEditor.getJSON()))
    },
    onBlur: () => onBlur?.(),
  })

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-card transition-[color,border-color,box-shadow] focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15 hover:border-muted-foreground/40',
        isInvalid && 'border-destructive ring-3 ring-destructive/20',
      )}
    >
      {editor ? (
        <>
          <RichTextToolbar editor={editor} />
          <EditorContent editor={editor} />
        </>
      ) : (
        <div className={cn('min-h-32', className)} />
      )}
    </div>
  )
}
