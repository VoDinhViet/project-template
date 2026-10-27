---
paths:
  - "web/**"
---

# Frontend — form, UI kit, giao diện

## Form: TanStack Form là chuẩn

**Cấm `react-hook-form`.** Dự án tham khảo còn sót RHF ở vài chỗ — không chép.

- **Không có component field gói sẵn** (`TextField`, `SelectField`, `createFormHook`/`useAppForm`): mỗi form dùng `useForm` và ghép thẳng `Field`/`FieldLabel`/`FieldError` của shadcn với `Input`/`Textarea`/`Select` ngay trong `<form.Field name="...">{(field) => ...}</form.Field>`. Hiện lỗi khi `isTouched && errors.length > 0`, kèm `aria-invalid`.
- Khởi tạo:
  ```ts
  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => mutate(value),
  })
  ```
  **Không dùng `validators.onSubmit`.**
- Phần tử form: `<form noValidate onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); if (form.state.isSubmitting) return; form.handleSubmit() }}>`. Mọi nút có `type` tường minh.
- Form dài thì tách khối JSX theo nhóm field trong cùng file, không tạo component field dùng chung.
- Đọc giá trị field anh em bằng `useField`; `form.Subscribe` chỉ dùng cho trạng thái cả form và selector trả về **object** (không trả tuple).
- **Schema**: dùng Zod (viết tay ở `features/<feature>/schemas/`) làm validator cho cả client và `.validator()` của server function.
  - Schema **tạo** và **sửa** viết riêng, không chia sẻ field. Tạo: chuỗi rỗng → `undefined`. Sửa: chuỗi rỗng → `null` (ngữ nghĩa PATCH). Schema sửa có trường id entity đầu tiên (`clientId: z.uuid()`).
  - Kiểu form lấy từ `z.input<typeof schema>`, xuất kèm `xFormDefaultValues`.
- Bộ lọc danh sách nằm trên **URL search params**: ô nhập giữ `useState` cục bộ + debounce 300ms rồi `navigate({ replace: true })`; đổi select thì đẩy lịch sử mới và reset `page: 1`; nút xoá lọc huỷ debounce đang chờ.

## UI kit: shadcn/ui trên Base UI

- Sinh bằng CLI: `pnpm dlx shadcn@latest add <component>`. **Không sửa tay `components/ui/`.** Cần khác đi thì bọc ở `components/shared`.
  Ngoại lệ người dùng đã duyệt: `select.tsx` chỉnh tay theo kiểu Hyper, `table.tsx` theo bảng của `web-qlsx-start` (khung viền, kẻ dọc giữa ô; header nền `secondary/40`, chữ in đậm), `dropdown-menu.tsx`, `input.tsx`, `textarea.tsx`, `input-group.tsx` đồng bộ với `select.tsx` (kiểu ô nhập nền xám không viền của Jira: nền `foreground/5`, rê chuột `foreground/8`; đang nhập thì nền trắng, viền `primary` + vòng `ring` 2px), `button.tsx`/`input.tsx`/`select.tsx` cao mặc định 36px (`h-9`, cỡ `sm` 32px), nút `outline` không viền, nền xám `secondary` kiểu Jira, nút `default` rê chuột sẫm lại, nút `destructive` nền đỏ đặc `destructive-ink`, `dialog.tsx` kiểu Hyper (header/footer có vạch ngăn, nền phủ đậm), mọi bề mặt nổi (`select`, `dropdown-menu`, `combobox`, `popover`, `hover-card`, `context-menu`, `menubar`, `dialog`, `alert-dialog`, `navigation-menu`, `card`) bỏ viền `ring-1`, tách nền bằng `shadow-popover`/`shadow-card`, `badge.tsx` bo góc `rounded-md` và tự đổi cặp `bg-X-soft text-X-ink` thành nền đặc `X-ink` chữ `text-card` kiểu Jira, trừ `neutral` giữ nhạt (có comment đầu file); chạy lại `shadcn add` cho các file này thì phải chỉnh lại.
- Ghép phần tử bằng prop **`render`** (Base UI), **không** dùng `asChild` của Radix: `<TooltipTrigger render={<Button />} />`. Link dạng nút: `createLink(Button)`.
- `cn()` lấy từ `@/lib/utils` (do shadcn sinh, dựa trên package `cn`); truyền chuỗi class inline.
- Icon trong code ứng dụng (`components/shared`, `features`) dùng **`@solar-icons/react`**; kiểu icon thể hiện **trạng thái** (người dùng chọn 2026-10-26, thay quy ước "Bold mọi chỗ" của 2026-10-24):
  - **Linear** (`@solar-icons/react/linear`): trạng thái nghỉ, mặc định, nhãn cạnh chữ, nút thao tác dòng bảng và trong menu `⋯`, trạng thái trống/chưa có.
  - **Bold** (`@solar-icons/react/bold`): đang chọn/đang bật/có giá trị (mục sidebar đang mở, quyền đã cấp), trạng thái cần chú ý có màu ngữ nghĩa (cảnh báo, lỗi, xong), ô icon trang trí trong thẻ.
  - Chỉ ghép hai kiểu này; chỉ cần cặp Linear/Bold khi một icon đổi theo trạng thái. Đã áp cho toàn bộ `web` (2026-10-26); icon nằm trong ô nền màu (tile), icon cảnh báo/xong và icon dữ liệu ở `constants/` giữ Bold. Icon dạng cặp (đổi theo trạng thái) import Linear kèm bí danh `XLinearIcon`.
  Icon không có class `size-*` thì mặc định 24px, nên phải tự đặt cỡ nếu cha không áp `[&_svg]:size-*`.
  `lucide-react` chỉ còn bên trong `components/ui` (shadcn sinh ra, `components.json` không hỗ trợ Solar); không dùng lucide ở nơi khác.
- Văn bản định dạng (mô tả issue, ghi chú báo cáo, vướng mắc) dùng `RichTextEditor` (Tiptap) để nhập và `RichTextContent` để hiển thị, đều ở `components/shared`. Giá trị là chuỗi JSON của tài liệu Tiptap, `''` khi rỗng; dữ liệu cũ là text thuần vẫn đọc được (`parseRichText`). Ô là `contenteditable` nên đặt tên bằng `aria-label`, không dùng `FieldLabel htmlFor`. `api` kiểm bằng `RichTextField` (`IsRichTextDocument`): thêm node/mark mới phải sửa cả hai phía. Không render HTML thô.
- Toast: `sonner`, `<Toaster richColors />` gắn ở `__root.tsx`.
- Bảng dữ liệu dùng **`@tanstack/react-table` v9** như `web-qlsx-start`: `useTable({ data, columns, features: appTableFeatures })` (`lib/table-features.ts`), cột dựng bằng `createColumnHelper<typeof appTableFeatures, X>()`, render bằng `flexRender` trên `Table` của shadcn. Class của từng cột đặt ở `meta.headerClassName`/`meta.cellClassName` (khai báo ở `lib/types/table.type.ts`). Cột là hằng cấp module trong file riêng `composites/<Xs>TableColumns.tsx` (`userColumns`, `invitationColumns`, `roleColumns`); bảng ở `sections/<Xs>Table.tsx` chỉ nhận dữ liệu và `isPending`. Ô cần quyền, người dùng hiện tại hay dữ liệu khác thì render một component tự đọc (`useHasPermission`, `useRouteContext({ from: '/(authed)' })`, `useQuery` trên factory đã cache), không truyền `currentUser`/`roles` qua props của bảng. Lọc, sắp xếp, phân trang làm phía server, không bật row model phía client.
- Bốn tầng component: `layouts` (khung trang) → `sections` (khối lớn gắn nghiệp vụ) → `composites` (ghép nhỏ, có hành vi) → `primitives` (thuần hiển thị).
- Trước khi tạo component shared: bỏ tên entity đi, còn gì đặc thù không? Chỉ trừu tượng khi đã lặp **lần thứ ba** (xem `common/layering.md`), và thêm kèm một chỗ dùng thật. Cố ý **không** trừu tượng: badge trạng thái, dialog xác nhận, header chi tiết, cột bảng, bộ lọc, thẻ thống kê.
- Prop trạng thái chờ luôn tên **`isPending`** (gắn `query.isFetching` để làm mờ bảng, `query.isPending` để hiện skeleton).

## Giao diện

- **Toàn bộ chữ hiển thị bằng tiếng Việt**, trừ thuật ngữ chuyên ngành quen dùng nguyên gốc: giữ tiếng Anh (`Issue`, `Board`, `Module`, `Epic`, `Story`, `Task`, `Bug`, `Story point`, `Sprint`, `Backlog`, `Scrum`, `Kanban`), không dịch gượng. Không có thư viện i18n: viết thẳng; `<html lang="vi">`; số/tiền dùng `Intl.NumberFormat('vi-VN')`; múi giờ hiển thị `Asia/Ho_Chi_Minh`.
- Giá trị enum trong code bằng tiếng Anh; nhãn tiếng Việt chỉ gán lúc hiển thị qua `Record<Enum, string>`.
- Dùng **token ngữ nghĩa** (`bg-primary`, `text-muted-foreground`, cặp `*-soft`/`*-ink` khi có); không dùng bảng màu thô (`bg-green-500`), không ghi đè `dark:` thủ công, không gradient/glow.
- Thang kích thước (chi tiết trong `web/DESIGN.md`): h1 trang `text-xl font-bold` (chỉ `PageShell`); tiêu đề card `text-base font-semibold`; tiêu đề con `text-sm font-semibold`; nội dung `text-sm`, phụ `text-xs`; nhãn viết hoa một kiểu `text-2xs font-bold tracking-wider uppercase`. Không dùng cỡ chữ tuỳ ý `text-[...]`, không chữ 10px.
- Control mặc định 36px (`h-9`, Button default/`icon`); 32px (`sm`/`icon-sm`) chỉ trong header card, dòng bảng, phân trang, item trong nhóm segmented. **Mọi control trên cùng một hàng toolbar cùng chiều cao.** Line tabs `h-12`, icon `size-4`.
- Thẻ `rounded-lg`, đệm `p-4 sm:p-5` (thẻ issue trên board `p-3`); header card có vạch `border-b px-4 py-3 sm:px-5`. Khoảng đệm trang `p-4 sm:p-5 lg:p-6`, `gap-4`; toolbar `gap-2`.
- Icon cạnh `text-sm` `size-4`, cạnh `text-xs` `size-3.5`. Icon chỉ có màu khi mang nghĩa: tạo `text-primary`, sửa/link `text-info-ink`, xoá/gỡ `text-destructive-ink`, ngày giờ `text-warning-ink`, người/vai trò `text-violet-ink`, xong `text-success-ink`; tìm kiếm, chevron, sắp xếp, `⋯`, đóng giữ trung tính. Nút nền đặc giữ icon cùng màu chữ.
- Trợ năng: nút chỉ có icon phải có `aria-label`; input lỗi có `aria-invalid`.
- Tailwind v4 qua `@tailwindcss/vite`; token ở `src/styles.css`, hệ thiết kế ghi ở `web/DESIGN.md`.

## Checklist

- [ ] Form dùng `useForm` + `revalidateLogic()` + `onDynamic`, field ghép inline, không RHF.
- [ ] Không sửa `components/ui/`; ghép bằng `render`, không `asChild`.
- [ ] Chữ UI tiếng Việt, token ngữ nghĩa, icon Solar Linear (nghỉ) / Bold (chọn, chú ý); lucide chỉ trong `components/ui`.
- [ ] Prop chờ tên `isPending`; nút icon có `aria-label`.
