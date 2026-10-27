import { useInfiniteQuery } from '@tanstack/react-query'
import type { QueryKey, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { UserAvatar } from '@/components/shared/primitives/UserAvatar'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { InputGroupAddon } from '@/components/ui/input-group'
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants'
import type { UserRef } from '@/lib/types/user.type'

type UserComboboxProps<TPage, TQueryKey extends QueryKey> = {
  /** Người đang chọn, lấy từ dữ liệu đã có nên không cần tra thêm. */
  value: UserRef | null
  /** Nhận chữ đang gõ (đã debounce), trả truy vấn phân trang đã `select` ra mảng user. */
  searchQueryOptions: (
    keyword: string | undefined,
  ) => UseInfiniteQueryOptions<TPage, Error, UserRef[], TQueryKey, number>
  /** Người không được chọn (đã thuộc nơi cần thêm vào); lọc trên trang đã tải. */
  excludedUserIds?: Set<string>
  label: string
  placeholder?: string
  isInvalid?: boolean
  /** Lựa chọn "không ai", ví dụ "Chưa giao"; bỏ trống thì bắt buộc chọn một người. */
  emptyLabel?: string
  onValueChange: (user: UserRef | null) => void
}

/** Ô chọn người tìm phía server, mỗi lần chỉ lấy một trang nhỏ rồi "Xem thêm", không tải hết danh sách. */
export function UserCombobox<TPage, TQueryKey extends QueryKey>({
  value,
  searchQueryOptions,
  excludedUserIds,
  label,
  placeholder,
  isInvalid = false,
  emptyLabel,
  onValueChange,
}: UserComboboxProps<TPage, TQueryKey>) {
  const [typedText, setTypedText] = useState('')
  const [keyword, setKeyword] = useState<string>()
  const {
    data: users = [],
    isFetching,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery(searchQueryOptions(keyword))

  useEffect(() => {
    const timer = setTimeout(
      () => setKeyword(typedText.trim() || undefined),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [typedText])

  // Lựa chọn rỗng là một mục giả có `id` rỗng để ô hiện được chữ "Chưa giao" khi đang chọn nó.
  const emptyUser: UserRef | undefined = emptyLabel
    ? { id: '', email: '', displayName: emptyLabel, avatarUrl: null }
    : undefined
  const selectableUsers = [
    ...(emptyUser && !keyword ? [emptyUser] : []),
    ...users.filter((user) => !excludedUserIds?.has(user.id)),
  ]

  return (
    <Combobox
      items={selectableUsers}
      value={value ?? emptyUser ?? null}
      filter={null}
      itemToStringLabel={(user) => user.displayName}
      isItemEqualToValue={(user, selectedUser) => user.id === selectedUser.id}
      onInputValueChange={(text, { reason }) => {
        if (reason === 'input-change') {
          setTypedText(text)
        }
      }}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setTypedText('')
        }
      }}
      onValueChange={(user) => onValueChange(user?.id ? user : null)}
    >
      <ComboboxInput
        aria-label={label}
        aria-invalid={isInvalid}
        placeholder={placeholder}
        className="w-full"
      >
        {value && (
          <InputGroupAddon align="inline-start">
            <UserAvatar user={value} size="sm" />
          </InputGroupAddon>
        )}
      </ComboboxInput>
      <ComboboxContent>
        <ComboboxEmpty>
          {isFetching ? 'Đang tìm…' : 'Không có kết quả'}
        </ComboboxEmpty>
        <ComboboxList>
          {(user: UserRef) => (
            <ComboboxItem key={user.id} value={user}>
              {user.id && <UserAvatar user={user} size="sm" />}
              {user.displayName}
            </ComboboxItem>
          )}
        </ComboboxList>
        {hasNextPage && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => fetchNextPage()}
          >
            Xem thêm
          </Button>
        )}
      </ComboboxContent>
    </Combobox>
  )
}
