# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** người quản lý theo dõi tiến độ — chủ nhiệm/ban điều hành CLB Khoa CNTT, trưởng phòng/quản lý
  doanh nghiệp. Họ vào để nắm tình hình nhiều dự án cùng lúc, giao việc, đôn đốc và quản lý người trong hệ
  thống (mời, phân vai trò, gỡ).
- **Secondary:** thành viên (sinh viên trong CLB, nhân viên) chỉ vào cập nhật task của mình.
- Dùng chủ yếu trên **máy tính** (laptop/PC); điện thoại chỉ cần xem và cập nhật nhanh.

## Product Purpose

Hệ thống quản lý dự án/task kiểu Jira. Mỗi bản triển khai phục vụ một đơn vị (CLB đại học hoặc doanh
nghiệp); không có khái niệm "tổ chức" trong hệ thống. Thành công là người quản lý nhìn vào là biết dự án nào
đang chậm, ai đang làm gì, và giao/đôn đốc việc được mà không cần công cụ khác.

## Positioning

- **Tiếng Việt và đơn giản:** ít khái niệm hơn Jira; sinh viên mới vào dùng được ngay không cần hướng dẫn.
- **Một hệ cho cả CLB lẫn doanh nghiệp:** cùng lõi (thành viên, vai trò, dự án, issue); phần riêng
  (nhiệm kỳ/chức vụ của CLB, phòng ban của doanh nghiệp) để sau.
- **Miễn phí / tự host:** chạy trên shared hosting cPanel rẻ, mỗi đơn vị tự quản dữ liệu của mình.

## Operating Context

- Đăng nhập bằng **Google** hoặc **email/mật khẩu** (Firebase Authentication). Tài khoản mật khẩu tạo qua link lời mời, phải xác minh email; quên mật khẩu có sẵn.
- **Chỉ người được mời mới vào**: đăng nhập mà chưa được mời thì chỉ thấy trang "Bạn chưa được mời".
  Mời qua **link mời** (chia sẻ tay qua Zalo/Messenger; gửi email để sau), người được mời phải tự chấp nhận
  bằng đúng email.
- Vai trò là **động** toàn hệ thống: tự tạo vai trò và chọn quyền; chỉ có sẵn vai trò toàn quyền
  "Chủ sở hữu" của **admin hệ thống duy nhất** (email `BOOTSTRAP_OWNER_EMAIL`), không trao cho ai khác và
  không hiện trong danh sách Thành viên.

## Capabilities and Constraints

- Đã có: đăng nhập (Google, email/mật khẩu, quên mật khẩu), thành viên, vai trò, lời mời, tổ chức (đơn vị,
  chức danh), lịch trực và ngày nghỉ, dự án, issue (bảng, board kéo thả, timeline, lịch, ma trận), bình luận,
  nhật ký hoạt động, báo cáo ngày, quy trình trạng thái kiểu Jira (sơ đồ, mũi tên chuyển, giới hạn WIP, mẫu),
  trang tình trạng hệ thống.
- Chưa có: sprint/backlog, thông báo, đính kèm file, email — **không được dựng số liệu hay biểu đồ giả cho
  những phần này**.
- Hosting không có WebSocket ổn định, Redis hay queue: realtime bằng polling.
- Toàn bộ chữ trên giao diện bằng tiếng Việt; ngày giờ theo `Asia/Ho_Chi_Minh`.

## Brand Commitments

- Tên hiển thị: "Smart Things" (logo đầu người + mạch, vẽ lại ở `AppLogo` và `public/favicon.svg`; giữ bố cục gốc, chỉ đổi màu và dày nét); đối tượng "CLB Khoa CNTT và doanh nghiệp".
- **Tham chiếu bắt buộc do người dùng chọn (2026-10-22):** bố cục admin theo mẫu **Hyper** (thay cho Skote
  chọn trước đó cùng ngày) — sidebar tối, nhóm menu viết hoa, topbar trắng có ô tìm kiếm kèm nút, tiêu đề trang bên trái
  với thao tác/breadcrumb bên phải, nền xám rất nhạt, card trắng.
- **Đổi tông 2026-10-24 (người dùng thấy bản Hyper nhạt nhoà):** giữ sidebar tối `#313a46` và card không viền
  (bóng mềm Hyper); màu chính **xanh Jira `#0052cc`**, chữ xanh đen `#172b4d`, nền gần trắng `#fafbfc` (đổi theo bảng màu Jira 2026-10-24); chữ đậm, tương phản cao; bo góc nhỏ; icon có màu theo
  nghĩa trong nút và bảng; cỡ chữ/control/khoảng cách theo một thang. Token và thang kích thước: `DESIGN.md`.

## Evidence on Hand

- Không có số liệu khách hàng, testimonial hay ảnh minh hoạ sản phẩm. Không bịa thêm.

## Product Principles

1. Người quản lý thấy tình hình trước, chi tiết sau: trang tổng quan ưu tiên số liệu thật và việc cần xử lý.
2. Một khái niệm, một tên: "Thành viên", "Vai trò", "Lời mời" — không lẫn thuật ngữ tiếng Anh trên UI.
3. Chỉ hiển thị dữ liệu thật; phần chưa có thì để trống có hướng dẫn, không dựng mẫu giả.
4. Quen thuộc hơn mới lạ: đây là công cụ làm việc hằng ngày, theo khuôn admin người dùng đã quen.
