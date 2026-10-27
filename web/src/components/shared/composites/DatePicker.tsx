import { CalendarIcon } from '@solar-icons/react/linear'
import { format, isValid, parse } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DatePickerProps = {
  id: string
  /** `YYYY-MM-DD`, chuỗi rỗng khi chưa chọn. */
  value: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  /** Ngày sớm nhất được chọn, `YYYY-MM-DD`. */
  minDate?: string
  /** Ô tuỳ chọn: hiện nút "Xoá ngày" khi đã có ngày. */
  isClearable?: boolean
  placeholder?: string
  disabled?: boolean
  'aria-invalid'?: boolean
}

// Chuỗi `YYYY-MM-DD` đọc theo giờ máy, không qua UTC, để ngày chọn không lệch một ngày.
function toDate(dateKey: string): Date | undefined {
  const date = parse(dateKey, 'yyyy-MM-dd', new Date())
  return isValid(date) ? date : undefined
}

export function DatePicker({
  id,
  value,
  onValueChange,
  onBlur,
  minDate,
  isClearable,
  placeholder = 'Chọn ngày',
  disabled,
  'aria-invalid': isInvalid,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedDate = toDate(value)
  const earliestDate = minDate ? toDate(minDate) : undefined

  return (
    <Popover
      open={isOpen}
      onOpenChange={(nextIsOpen) => {
        setIsOpen(nextIsOpen)
        if (!nextIsOpen) onBlur?.()
      }}
    >
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={isInvalid}
            className="w-full justify-start rounded-md bg-clip-border bg-foreground/5 px-2.5 font-normal hover:bg-foreground/8 data-popup-open:border-primary data-popup-open:bg-card data-popup-open:ring-2 data-popup-open:ring-ring/50"
          />
        }
      >
        <CalendarIcon aria-hidden className="size-4 text-warning-ink" />
        <span className={cn(!selectedDate && 'text-muted-foreground')}>
          {selectedDate
            ? format(selectedDate, 'EEEEEE, dd/MM/yyyy', { locale: vi })
            : placeholder}
        </span>
      </PopoverTrigger>
      {/* Mở bằng chuột thì giữ focus ở nút ngày; mặc định Base UI dồn focus vào nút
          "tháng trước" và hiện vòng focus. */}
      <PopoverContent
        align="start"
        className="w-auto gap-0 p-0"
        initialFocus={(interactionType) => interactionType === 'keyboard'}
      >
        <Calendar
          mode="single"
          locale={vi}
          weekStartsOn={1}
          className="p-3 [--cell-size:--spacing(9)]"
          formatters={{
            formatWeekdayName: (date) =>
              date.getDay() === 0 ? 'CN' : `T${date.getDay() + 1}`,
          }}
          selected={selectedDate}
          defaultMonth={selectedDate ?? earliestDate}
          disabled={earliestDate && { before: earliestDate }}
          onSelect={(date) => {
            if (!date) return
            onValueChange(format(date, 'yyyy-MM-dd'))
            setIsOpen(false)
            onBlur?.()
          }}
        />
        {isClearable && selectedDate && (
          <div className="flex justify-end border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onValueChange('')
                setIsOpen(false)
                onBlur?.()
              }}
            >
              Xoá ngày
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
