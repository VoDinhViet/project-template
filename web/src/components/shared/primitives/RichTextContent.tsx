import { Fragment } from 'react'
import type { ReactNode } from 'react'
import type { JSONContent } from '@tiptap/react'
import { RICH_TEXT_LINK_PATTERN, parseRichText } from '@/lib/rich-text'
import { cn } from '@/lib/utils'

type RichTextContentProps = {
  /** Chuỗi JSON của `RichTextEditor`, hoặc text thuần của dữ liệu cũ. */
  value: string
  className?: string
}

type NodeRenderer = (node: JSONContent, children: ReactNode) => ReactNode

// Dựng thẳng thành phần tử React từ danh sách node đã biết, không qua HTML thô nên không cần làm sạch.
const nodeRenderers: Partial<Record<string, NodeRenderer>> = {
  paragraph: (_node, children) => <p>{children ?? <br />}</p>,
  heading: (node, children) =>
    node.attrs?.level === 3 ? <h3>{children}</h3> : <h2>{children}</h2>,
  bulletList: (_node, children) => <ul>{children}</ul>,
  orderedList: (_node, children) => <ol>{children}</ol>,
  listItem: (_node, children) => <li>{children}</li>,
  taskList: (_node, children) => <ul data-type="taskList">{children}</ul>,
  taskItem: (node, children) => (
    <li data-type="taskItem" data-checked={node.attrs?.checked === true}>
      <label>
        <input
          type="checkbox"
          aria-label="Việc cần làm"
          checked={node.attrs?.checked === true}
          disabled
        />
      </label>
      <div>{children}</div>
    </li>
  ),
  blockquote: (_node, children) => <blockquote>{children}</blockquote>,
  codeBlock: (_node, children) => (
    <pre>
      <code>{children}</code>
    </pre>
  ),
  hardBreak: () => <br />,
  horizontalRule: () => <hr />,
}

const markRenderers: Partial<
  Record<
    string,
    (content: ReactNode, attrs: Record<string, unknown>) => ReactNode
  >
> = {
  bold: (content) => <strong>{content}</strong>,
  italic: (content) => <em>{content}</em>,
  underline: (content) => <u>{content}</u>,
  strike: (content) => <s>{content}</s>,
  code: (content) => <code>{content}</code>,
  link: (content, attrs) =>
    typeof attrs.href === 'string' &&
    RICH_TEXT_LINK_PATTERN.test(attrs.href) ? (
      <a href={attrs.href} target="_blank" rel="noopener noreferrer nofollow">
        {content}
      </a>
    ) : (
      content
    ),
}

function renderNode(node: JSONContent, key: number): ReactNode {
  if (node.type === 'text') {
    const text = (node.marks ?? []).reduce<ReactNode>(
      (content, mark) =>
        // `hasOwn` để khoá như `constructor` không lọt vào prototype của object tra bảng.
        (Object.hasOwn(markRenderers, mark.type)
          ? markRenderers[mark.type]?.(content, mark.attrs ?? {})
          : null) ?? content,
      node.text,
    )
    return <Fragment key={key}>{text}</Fragment>
  }
  const children = node.content?.map((child, index) => renderNode(child, index))
  const rendered =
    node.type && Object.hasOwn(nodeRenderers, node.type)
      ? nodeRenderers[node.type]?.(node, children)
      : null
  return <Fragment key={key}>{rendered ?? children}</Fragment>
}

/** Hiển thị chỉ-đọc nội dung do `RichTextEditor` lưu; dữ liệu text thuần cũ vẫn hiện đúng từng dòng. */
export function RichTextContent({ value, className }: RichTextContentProps) {
  return (
    <div className={cn('rich-text', className)}>
      {parseRichText(value).content?.map((node, index) =>
        renderNode(node, index),
      )}
    </div>
  )
}
