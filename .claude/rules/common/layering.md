# Phân lớp: tách đủ dùng, không chồng lớp

Mỗi lớp tự viết (hàm, hook, component, class, file) phải **che giấu nhiều hơn nó bày ra**: người gọi được bớt một
việc phải biết. Lớp chỉ chuyển tiếp lời gọi bắt người đọc nhảy thêm một chỗ mà không học thêm được gì.

Rule này áp cho lớp **tự đặt thêm**. Các lớp cấu trúc trong `backend/structure.md` (controller → service →
`*.query.ts`/`*.write.ts`) và `frontend/structure.md` (server function → `queryOptions` → page, bốn tầng
component, barrel `api/index.ts`) là bắt buộc, không tính là chồng lớp.

Nguồn: Fowler, *Refactoring* (mùi "Middle Man", "Lazy Element"; phép "Inline Function", "Remove Middle Man");
Ousterhout, *A Philosophy of Software Design* (cờ đỏ "pass-through method", "shallow module"); Sandi Metz, "The
Wrong Abstraction" ("duplication is far cheaper than the wrong abstraction").

## Tách thành lớp riêng khi

- Logic giống nhau thật ở **từ lần dùng thứ ba** (rule of three). Hai lần thì cứ lặp; giống tình cờ thì không gộp.
- Đóng gói **một quy tắc nghiệp vụ hoặc bảo mật có tên**, cần gọi nhất quán ở mọi nơi, kể cả khi mới một chỗ
  dùng: `ensureCanGrantRole`, `ensureCanGrantPermissions`, `readRouteAccess`, `resolveInternalRedirect`.
- Hàm cha vượt giới hạn kích thước (hàm > ~40–50 dòng, component > ~150 dòng, lồng > 3 tầng) và phần tách ra có
  **tên nói đúng một việc**.
- Che một thư viện bằng **hành vi thật** (ánh xạ lỗi, khởi tạo lười, cấu hình dùng chung), như `FirebaseService`.

## Viết inline khi (Inline Function / Remove Middle Man)

- Hàm, hook hay component **chỉ chuyển tiếp** sang một hàm khác với cùng tham số (hoặc chỉ đổi tên), không thêm
  kiểm tra, xử lý lỗi hay mặc định có nghĩa.
- Helper **dùng một lần**, vài dòng, đọc tại chỗ rõ hơn đọc tên hàm (`isSessionRejected`, `toClientError` đã bỏ
  vì lý do này).
- Hằng hay biến trung gian dùng một lần mà không đặt tên cho một khái niệm (Inline Variable).
- Re-export, khai báo lại kiểu hay hằng chỉ để chuyển tiếp.
- Trừu tượng hoá sai (phải thêm tham số, cờ `if` cho từng nơi gọi): inline lại vào từng nơi gọi, rồi chỉ tách
  phần giống nhau thật.

## Tự phản biện code vừa viết

Trước khi giao, đọc lại code mình viết như người chưa thấy nó và hỏi "đã sạch chưa?". Chưa sạch thì sửa rồi mới giao,
không đợi người dùng chỉ ra.

- Một việc có cách đọc ngay ở lần đầu: chọn cách đó, không chọn cách dài dòng hay lắt léo hơn. Điều kiện nhiều vế
  cùng một phép kiểm lặp lại thì gom bằng `some`/`every` thay vì chuỗi `||`/`&&` lặp lại.
- Không dựng biến, cờ hay hàm trung gian khi nó không làm rõ thêm điều gì.
- Một hàm đọc xong phải nói được "nó làm gì" trong một câu; nói không được thì chưa sạch.
- Code người dùng dán hoặc đề xuất: làm theo ý họ. Chỉ nêu ý kiến khi thấy lỗi thật (sai hành vi, mất kiểm tra
  kiểu, vi phạm rule khác), nói ngắn rồi để họ quyết; không đổi sang cách viết khác chỉ vì khẩu vị.

## Cách kiểm

- Đi từ điểm vào (route, controller) tới thư viện: mỗi bước nhảy phải trả lời được "bước này thêm gì?". Không trả
  lời được thì gộp vào bước trước hoặc sau.
- Thao tác đơn giản (đọc một bản ghi, gọi một API) không qua quá ba bước tự viết.
- Trước khi tạo helper: đếm chỗ gọi thật (`grep`), không tạo cho chỗ dùng "sắp tới".
- Sửa code cũ: chỉ gộp lớp trong phạm vi đang sửa, không dọn lan sang file không liên quan.

## Checklist

- [ ] Không còn hàm/hook/component chỉ chuyển tiếp lời gọi.
- [ ] Helper mới có ≥ 3 chỗ dùng, hoặc mang một quy tắc có tên, hoặc tách để hàm cha đủ nhỏ.
- [ ] Chuỗi gọi cho thao tác đơn giản ≤ 3 bước tự viết.
- [ ] Đã đọc lại code vừa viết và tự hỏi "đã sạch chưa" trước khi giao.
