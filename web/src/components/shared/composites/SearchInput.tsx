import { MagnifierIcon } from '@solar-icons/react/linear'
import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants'

type SearchInputProps = {
  value: string
  label: string
  placeholder?: string
  onSearch: (keyword: string) => void
}

/** Giữ chữ đang gõ ở state cục bộ và chỉ đẩy lên URL sau khi ngừng gõ. */
export function SearchInput({
  value,
  label,
  placeholder,
  onSearch,
}: SearchInputProps) {
  const [draft, setDraft] = useState(value)
  const lastSearchedRef = useRef(value)

  // Chỉ đồng bộ khi URL đổi từ nơi khác (nút xoá lọc, điều hướng), không ghi đè chữ đang gõ.
  useEffect(() => {
    if (value !== lastSearchedRef.current) {
      lastSearchedRef.current = value
      setDraft(value)
    }
  }, [value])

  useEffect(() => {
    if (draft === lastSearchedRef.current) {
      return
    }
    const timer = setTimeout(() => {
      lastSearchedRef.current = draft
      onSearch(draft)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, onSearch])

  return (
    <div className="relative w-full max-w-xs sm:w-64">
      <MagnifierIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="pl-8"
      />
    </div>
  )
}
