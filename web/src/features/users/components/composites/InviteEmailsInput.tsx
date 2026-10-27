import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'
import { z } from 'zod'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants'
import { parseEmailList } from '@/lib/invitation'
import { cn } from '@/lib/utils'
import {
  allUsersQueryOptions,
  invitationSuggestionsQueryOptions,
} from '../../api'
import type { InvitationSuggestion } from '../../types/invitation.type'

const SEPARATOR_KEYS = new Set(['Enter', ',', ';', ' '])

const emailSchema = z.email()

const suggestionStatusLabels: Record<InvitationSuggestion['status'], string> = {
  EXPIRED: 'Đã hết hạn',
  REVOKED: 'Đã thu hồi',
}

type InviteEmailsInputProps = {
  emails: string[]
  isInvalid: boolean
  onEmailsChange: (emails: string[]) => void
  onBlur: () => void
}

/**
 * Ô nhập email dạng chip kèm gợi ý từ lời mời cũ.
 *
 * Rules:
 * - Chip sai định dạng vẫn giữ lại (đỏ) để người dùng thấy và xoá; `createInvitationsFormSchema` chặn gửi.
 * - Tự thêm chip khi rời ô chỉ nếu chữ đang gõ đã là email hợp lệ, để bấm vào gợi ý không biến chữ gõ dở
 *   thành chip sai.
 */
export function InviteEmailsInput({
  emails,
  isInvalid,
  onEmailsChange,
  onBlur,
}: InviteEmailsInputProps) {
  const anchor = useComboboxAnchor()
  const inputRef = useRef<HTMLInputElement>(null)
  const [typedText, setTypedText] = useState('')
  const [keyword, setKeyword] = useState('')
  const [highlightedEmail, setHighlightedEmail] = useState<string>()
  const { data: suggestions = [] } = useQuery({
    ...invitationSuggestionsQueryOptions({ q: keyword || undefined }),
    placeholderData: keepPreviousData,
  })
  const { data: allUsers = [] } = useQuery(allUsersQueryOptions())
  const emailsWithAccess = new Set(
    allUsers.map((user) => user.email.toLowerCase()),
  )
  const suggestionByEmail = new Map(
    suggestions.map((suggestion) => [suggestion.email, suggestion]),
  )
  const suggestedEmails = suggestions
    .map((suggestion) => suggestion.email)
    .filter((email) => !emails.includes(email))

  useEffect(() => {
    const timer = setTimeout(
      () => setKeyword(typedText.trim()),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [typedText])

  const addTypedEmails = (text: string) => {
    const typedEmails = parseEmailList(text)
    if (typedEmails.length > 0) {
      onEmailsChange([...new Set([...emails, ...typedEmails])])
    }
    setTypedText('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!SEPARATOR_KEYS.has(event.key) || typedText.trim() === '') {
      return
    }
    // Enter khi đang tô sáng một gợi ý là chọn gợi ý đó, để Combobox tự xử lý.
    if (event.key === 'Enter' && highlightedEmail !== undefined) {
      return
    }
    event.preventDefault()
    addTypedEmails(typedText)
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData('text')
    if (parseEmailList(pastedText).length > 1) {
      event.preventDefault()
      addTypedEmails(`${typedText} ${pastedText}`)
    }
  }

  return (
    <Combobox
      multiple
      items={suggestedEmails}
      value={emails}
      filter={null}
      inputValue={typedText}
      onValueChange={(nextEmails, { reason }) => {
        // Base UI xoá hết lựa chọn khi nhấn Escape lúc chưa mở danh sách; không để mất chip chỉ vì muốn đóng hộp thoại.
        if (reason === 'escape-key') {
          return
        }
        onEmailsChange(nextEmails)
        setTypedText('')
      }}
      onInputValueChange={(text, { reason }) => {
        if (reason === 'input-change') {
          setTypedText(text)
        }
      }}
      onItemHighlighted={(email) => setHighlightedEmail(email)}
    >
      <ComboboxChips
        ref={anchor}
        aria-invalid={isInvalid}
        // Cao bằng ô nhập nhiều dòng và cuộn khi quá nhiều chip, để không đẩy phần vai trò xuống mất hút.
        className="max-h-48 min-h-28 cursor-text content-start overflow-y-auto"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            inputRef.current?.focus()
          }
        }}
      >
        <ComboboxValue>
          {(selectedEmails: string[]) => (
            <>
              {selectedEmails.map((email) => {
                const isMalformed = !emailSchema.safeParse(email).success
                const hasAccess = emailsWithAccess.has(email)
                const chipStatus = isMalformed
                  ? 'không hợp lệ'
                  : hasAccess
                    ? 'đã có quyền, sẽ bỏ qua'
                    : undefined
                return (
                  <ComboboxChip
                    key={email}
                    aria-label={chipStatus ? `${email}, ${chipStatus}` : email}
                    className={cn(
                      isMalformed && 'bg-destructive-soft text-destructive-ink',
                      hasAccess && 'bg-warning-soft text-warning-ink',
                    )}
                    title={
                      hasAccess
                        ? 'Đã có quyền vào hệ thống, sẽ bỏ qua'
                        : undefined
                    }
                  >
                    {email}
                  </ComboboxChip>
                )
              })}
              <ComboboxChipsInput
                ref={inputRef}
                aria-label="Email người được mời"
                aria-invalid={isInvalid}
                placeholder={selectedEmails.length === 0 ? 'an@gmail.com' : ''}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={() => {
                  if (emailSchema.safeParse(typedText.trim()).success) {
                    addTypedEmails(typedText)
                  }
                  onBlur()
                }}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      {suggestedEmails.length > 0 && (
        <ComboboxContent anchor={anchor}>
          <p className="px-4 pt-2 pb-1 text-2xs font-bold tracking-wider text-muted-foreground uppercase">
            {keyword ? 'Gợi ý' : 'Mời lại gần đây'}
          </p>
          <ComboboxList>
            {(email: string) => (
              <ComboboxItem key={email} value={email}>
                <span className="min-w-0 flex-1 truncate">{email}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {
                    suggestionStatusLabels[
                      suggestionByEmail.get(email)?.status ?? 'EXPIRED'
                    ]
                  }
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      )}
    </Combobox>
  )
}
