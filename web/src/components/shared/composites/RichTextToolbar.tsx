import {
  Code2Icon,
  CodeIcon,
  ListCheckIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  TextBoldIcon,
  TextCrossIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  UndoLeftIcon,
  UndoRightIcon,
} from '@solar-icons/react/bold'
import { LinkIcon } from '@solar-icons/react/linear'
import type { Icon } from '@solar-icons/react/lib/types'
import { useEditorState } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Toggle } from '@/components/ui/toggle'
import { RICH_TEXT_LINK_PATTERN } from '@/lib/rich-text'

type RichTextToolbarProps = {
  editor: Editor
}

/** `isActive` có mặt thì là nút bật/tắt (đậm, danh sách...); không có thì là hành động một lần (hoàn tác...). */
type ToolbarItem = {
  label: string
  isActive?: boolean
  isDisabled?: boolean
  onClick: () => void
} & ({ icon: Icon } | { text: string })

/** Địa chỉ không có giao thức (`example.com`) được hiểu là `https://`. */
function toLinkHref(input: string): string {
  const trimmed = input.trim()
  return RICH_TEXT_LINK_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`
}

function RichTextLinkButton({ editor }: RichTextToolbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const isLinkActive = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => currentEditor.isActive('link'),
  })

  const applyLink = () => {
    const href = toLinkHref(linkInput)
    const chain = editor.chain().focus().extendMarkRange('link')
    if (linkInput.trim() === '') {
      chain.unsetLink().run()
    } else if (editor.state.selection.empty && !isLinkActive) {
      // Chưa chọn chữ nào thì không có gì để gắn, nên chèn luôn địa chỉ làm chữ của liên kết.
      chain
        .insertContent({
          type: 'text',
          text: href,
          marks: [{ type: 'link', attrs: { href } }],
        })
        .run()
    } else {
      chain.setLink({ href }).run()
    }
    setIsOpen(false)
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          const currentHref: unknown = editor.getAttributes('link').href
          setLinkInput(typeof currentHref === 'string' ? currentHref : '')
        }
        setIsOpen(nextOpen)
      }}
    >
      <PopoverTrigger
        render={
          <Toggle
            aria-label="Liên kết"
            title="Liên kết"
            pressed={isLinkActive}
            className="aria-pressed:bg-primary/10 aria-pressed:text-primary"
          />
        }
      >
        <LinkIcon aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        // Mặc định Popover trả focus về nút liên kết, còn người dùng cần tiếp tục gõ trong editor.
        finalFocus={false}
        className="flex w-80 gap-2"
      >
        <Input
          autoFocus
          value={linkInput}
          placeholder="https://..."
          aria-label="Địa chỉ liên kết"
          onChange={(event) => setLinkInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              applyLink()
            }
          }}
        />
        <Button
          type="button"
          disabled={linkInput.trim() === '' && !isLinkActive}
          onClick={applyLink}
        >
          {linkInput.trim() === '' ? 'Gỡ liên kết' : 'Áp dụng'}
        </Button>
      </PopoverContent>
    </Popover>
  )
}

/** Thanh công cụ của `RichTextEditor`: các định dạng Jira có, nhóm bằng vạch ngăn. */
export function RichTextToolbar({ editor }: RichTextToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      isHeading2: currentEditor.isActive('heading', { level: 2 }),
      isHeading3: currentEditor.isActive('heading', { level: 3 }),
      isBold: currentEditor.isActive('bold'),
      isItalic: currentEditor.isActive('italic'),
      isUnderline: currentEditor.isActive('underline'),
      isStrike: currentEditor.isActive('strike'),
      isCode: currentEditor.isActive('code'),
      isBulletList: currentEditor.isActive('bulletList'),
      isOrderedList: currentEditor.isActive('orderedList'),
      isTaskList: currentEditor.isActive('taskList'),
      isBlockquote: currentEditor.isActive('blockquote'),
      isCodeBlock: currentEditor.isActive('codeBlock'),
      canUndo: currentEditor.can().undo(),
      canRedo: currentEditor.can().redo(),
    }),
  })
  const chain = () => editor.chain().focus()
  const formatGroups: ToolbarItem[][] = [
    [
      {
        label: 'Tiêu đề lớn',
        text: 'H2',
        isActive: state.isHeading2,
        onClick: () => chain().toggleHeading({ level: 2 }).run(),
      },
      {
        label: 'Tiêu đề nhỏ',
        text: 'H3',
        isActive: state.isHeading3,
        onClick: () => chain().toggleHeading({ level: 3 }).run(),
      },
    ],
    [
      {
        label: 'Đậm',
        icon: TextBoldIcon,
        isActive: state.isBold,
        onClick: () => chain().toggleBold().run(),
      },
      {
        label: 'Nghiêng',
        icon: TextItalicIcon,
        isActive: state.isItalic,
        onClick: () => chain().toggleItalic().run(),
      },
      {
        label: 'Gạch chân',
        icon: TextUnderlineIcon,
        isActive: state.isUnderline,
        onClick: () => chain().toggleUnderline().run(),
      },
      {
        label: 'Gạch ngang',
        icon: TextCrossIcon,
        isActive: state.isStrike,
        onClick: () => chain().toggleStrike().run(),
      },
      {
        label: 'Mã trong dòng',
        icon: CodeIcon,
        isActive: state.isCode,
        onClick: () => chain().toggleCode().run(),
      },
    ],
    [
      {
        label: 'Danh sách dấu đầu dòng',
        icon: ListIcon,
        isActive: state.isBulletList,
        onClick: () => chain().toggleBulletList().run(),
      },
      {
        label: 'Danh sách đánh số',
        icon: ListOrderedIcon,
        isActive: state.isOrderedList,
        onClick: () => chain().toggleOrderedList().run(),
      },
      {
        label: 'Danh sách việc cần làm',
        icon: ListCheckIcon,
        isActive: state.isTaskList,
        onClick: () => chain().toggleTaskList().run(),
      },
    ],
    [
      {
        label: 'Trích dẫn',
        icon: QuoteIcon,
        isActive: state.isBlockquote,
        onClick: () => chain().toggleBlockquote().run(),
      },
      {
        label: 'Khối mã',
        icon: Code2Icon,
        isActive: state.isCodeBlock,
        onClick: () => chain().toggleCodeBlock().run(),
      },
      {
        label: 'Đường kẻ ngang',
        icon: MinusIcon,
        onClick: () => chain().setHorizontalRule().run(),
      },
    ],
  ]
  const historyGroup: ToolbarItem[] = [
    {
      label: 'Hoàn tác',
      icon: UndoLeftIcon,
      isDisabled: !state.canUndo,
      onClick: () => chain().undo().run(),
    },
    {
      label: 'Làm lại',
      icon: UndoRightIcon,
      isDisabled: !state.canRedo,
      onClick: () => chain().redo().run(),
    },
  ]

  const renderItem = (item: ToolbarItem) =>
    item.isActive === undefined ? (
      <Button
        key={item.label}
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={item.label}
        title={item.label}
        disabled={item.isDisabled}
        onClick={item.onClick}
      >
        {'icon' in item && <item.icon aria-hidden />}
      </Button>
    ) : (
      <Toggle
        key={item.label}
        aria-label={item.label}
        title={item.label}
        pressed={item.isActive}
        disabled={item.isDisabled}
        onPressedChange={item.onClick}
        className="aria-pressed:bg-primary/10 aria-pressed:text-primary"
      >
        {'icon' in item ? (
          <item.icon aria-hidden />
        ) : (
          <span className="text-xs font-bold">{item.text}</span>
        )}
      </Toggle>
    )
  const groupClassName =
    'flex items-center gap-0.5 not-first:border-l not-first:border-input not-first:pl-1'

  return (
    <div
      role="group"
      aria-label="Định dạng văn bản"
      className="flex flex-wrap items-center gap-x-1 gap-y-0.5 border-b border-input px-1.5 py-1"
      onMouseDown={(event) => {
        // Bấm nút không được lấy focus khỏi editor (nếu không ô bị coi là đã chạm, hiện lỗi ngay khi đang định dạng); ô nhập
        // địa chỉ trong popover vẫn nổi bọt sự kiện này qua portal nên chỉ chặn khi bấm trong thanh.
        if (
          event.target instanceof Node &&
          event.currentTarget.contains(event.target)
        ) {
          event.preventDefault()
        }
      }}
    >
      {formatGroups.map((group) => (
        <div key={group[0].label} className={groupClassName}>
          {group.map(renderItem)}
        </div>
      ))}
      <div className={groupClassName}>
        <RichTextLinkButton editor={editor} />
      </div>
      <div className={groupClassName}>{historyGroup.map(renderItem)}</div>
    </div>
  )
}
