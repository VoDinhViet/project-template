import { ClockCircleIcon } from '@solar-icons/react/linear'
import { useState } from 'react'
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { InputGroupAddon } from '@/components/ui/input-group'

const TIME_STEP_MINUTES = 15
const MINUTES_PER_DAY = 24 * 60

const timeOptions = Array.from(
  { length: MINUTES_PER_DAY / TIME_STEP_MINUTES },
  (_, stepIndex) => {
    const minuteOfDay = stepIndex * TIME_STEP_MINUTES
    const hour = String(Math.floor(minuteOfDay / 60)).padStart(2, '0')
    const minute = String(minuteOfDay % 60).padStart(2, '0')
    return `${hour}:${minute}`
  },
)

/** Đọc giờ gõ tay (`7`, `730`, `7:5`, `19:30`) thành `HH:mm`; `null` khi không phải giờ hợp lệ. */
function toTimeKey(typedText: string): string | null {
  const text = typedText.trim()
  let hour: number
  let minute: number
  if (text.includes(':')) {
    const [hourText = '', minuteText = ''] = text.split(':')
    if (!/^\d{1,2}$/.test(hourText) || !/^\d{1,2}$/.test(minuteText)) {
      return null
    }
    hour = Number(hourText)
    minute = Number(minuteText)
  } else {
    if (!/^\d{1,4}$/.test(text)) return null
    // Từ 3 chữ số trở lên, hai chữ số cuối là phút: `730` là 7:30, `1930` là 19:30.
    const hourText = text.length > 2 ? text.slice(0, -2) : text
    hour = Number(hourText)
    minute = text.length > 2 ? Number(text.slice(-2)) : 0
  }
  if (hour > 23 || minute > 59) return null
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

type TimePickerProps = {
  id: string
  /** `HH:mm`, chuỗi rỗng khi chưa chọn. */
  value: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  'aria-invalid'?: boolean
}

export function TimePicker({
  id,
  value,
  onValueChange,
  onBlur,
  disabled,
  'aria-invalid': isInvalid,
}: TimePickerProps) {
  const listAnchor = useComboboxAnchor()
  const [typedText, setTypedText] = useState(value)
  // Giá trị đổi từ ngoài (nút ca mẫu, đặt lại form) thì ô nhập theo giá trị mới.
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    setTypedText(value)
  }

  function commitTypedText() {
    const timeKey = toTimeKey(typedText)
    if (timeKey === null) {
      setTypedText(value)
      return
    }
    setTypedText(timeKey)
    if (timeKey !== value) onValueChange(timeKey)
  }

  return (
    <Combobox
      items={timeOptions}
      value={value || null}
      inputValue={typedText}
      autoHighlight
      disabled={disabled}
      onInputValueChange={setTypedText}
      onValueChange={(timeOption) => {
        if (timeOption) onValueChange(timeOption)
      }}
      // So theo chữ số để gõ `7` hay `730` đều ra đúng mốc `07:00`, `07:30`.
      filter={(timeOption, query) => {
        const typedDigits = query.replace(/\D/g, '')
        const optionDigits = timeOption.replace(':', '')
        return (
          optionDigits.startsWith(typedDigits) ||
          optionDigits.startsWith(`0${typedDigits}`)
        )
      }}
    >
      {/* Danh sách neo vào cả nhóm ô nhập, không neo vào `<input>` bên trong nên mới thẳng
          mép với ô ngày. */}
      <div ref={listAnchor}>
        {/* `<input>` bên trong cao 36px hơn ruột nhóm (34px, đã trừ viền); để nền trắng khi
            focus thì nó che mất viền xanh của nhóm. */}
        <ComboboxInput
          id={id}
          className="*:data-[slot=input-group-control]:h-full *:data-[slot=input-group-control]:hover:bg-transparent *:data-[slot=input-group-control]:focus-visible:bg-transparent"
          placeholder="--:--"
          showTrigger={false}
          aria-invalid={isInvalid}
          onBlur={() => {
            commitTypedText()
            onBlur?.()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitTypedText()
          }}
        >
          <InputGroupAddon align="inline-start">
            <ClockCircleIcon aria-hidden className="size-4 text-warning-ink" />
          </InputGroupAddon>
        </ComboboxInput>
      </div>
      <ComboboxContent anchor={listAnchor}>
        <ComboboxList>
          {(timeOption: string) => (
            <ComboboxItem key={timeOption} value={timeOption}>
              {timeOption}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
