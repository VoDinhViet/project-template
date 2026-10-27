export type InvitationEmailInput = {
  inviterName: string;
  roleName: string;
  link: string;
  ttlDays: number;
};

export type MailContent = {
  subject: string;
  html: string;
  text: string;
};

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Tên người mời và vai trò do người dùng nhập, nên phải escape trước khi đưa vào HTML. */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

// Tên hiển thị lấy từ hồ sơ Google/Firebase, nên không để dài đủ chứa một câu lừa đảo trong tiêu đề.
const MAX_SUBJECT_NAME_LENGTH = 40;

/** Gộp mọi khoảng trắng (kể cả xuống dòng) để tên vai trò không tự ngắt đoạn trong bản text. */
function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Giao diện khớp token của `web`: dải đầu `sidebar`, nút `primary`, nền xám `muted`, bo góc 4px.
 *
 * Rules:
 * - Bố cục bằng bảng và style inline, vì nhiều ứng dụng mail không hỗ trợ CSS hiện đại.
 * - Giữ cùng nội dung với template `invitation` trên Resend để hai bản không lệch nhau.
 */
export function buildInvitationEmail({
  inviterName: rawInviterName,
  roleName: rawRoleName,
  link,
  ttlDays,
}: InvitationEmailInput): MailContent {
  const inviterName = collapseWhitespace(rawInviterName);
  const roleName = collapseWhitespace(rawRoleName);
  const subject = `${inviterName.slice(0, MAX_SUBJECT_NAME_LENGTH)} mời bạn vào Smart Things`;
  const safeInviterName = escapeHtml(inviterName);
  const safeRoleName = escapeHtml(roleName);
  const safeLink = escapeHtml(link);

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Lời mời vào Smart Things</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f8f9;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f8f9" style="background-color:#f7f8f9;">
<tr>
<td align="center" style="padding:32px 16px;">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
<tr>
<td bgcolor="#313a46" align="center" style="background-color:#313a46;border-top-left-radius:4px;border-top-right-radius:4px;padding:24px 32px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:26px;font-weight:bold;letter-spacing:2px;color:#ffffff;">SMART THINGS</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;letter-spacing:3px;color:#9ca8b8;padding-top:2px;">SUCCESS TOGETHER</td>
</tr>
</table>
</td>
</tr>
<tr>
<td bgcolor="#ffffff" style="background-color:#ffffff;border-bottom-left-radius:4px;border-bottom-right-radius:4px;border-left:1px solid #dfe1e6;border-right:1px solid #dfe1e6;border-bottom:1px solid #dfe1e6;padding:32px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;font-weight:bold;color:#172b4d;padding-bottom:12px;">Bạn được mời tham gia</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#5e6c84;padding-bottom:20px;"><strong style="color:#172b4d;">${safeInviterName}</strong> đã mời bạn vào hệ thống quản lý dự án Smart Things. Đăng nhập bằng đúng email này (Google hoặc tạo mật khẩu) để bắt đầu.</td>
</tr>
<tr>
<td style="padding-bottom:24px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td bgcolor="#f4f5f7" style="background-color:#f4f5f7;border-radius:4px;padding:12px 16px;">
<table cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:bold;letter-spacing:1px;color:#5e6c84;padding-bottom:2px;">VAI TRÒ CỦA BẠN</td>
</tr>
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:bold;color:#172b4d;">${safeRoleName}</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="padding-bottom:12px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" bgcolor="#0052cc" style="background-color:#0052cc;border-radius:4px;"><a href="${safeLink}" target="_blank" style="display:block;padding:14px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:bold;color:#ffffff;text-decoration:none;text-align:center;">Chấp nhận lời mời</a></td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#5e6c84;padding-bottom:24px;">Bấm nút để mở trang xác nhận. Link có hiệu lực <strong style="color:#172b4d;">${ttlDays} ngày</strong> và chỉ dùng được cho email này.</td>
</tr>
<tr>
<td style="border-top:1px solid #dfe1e6;padding-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#5e6c84;">Nút không bấm được? Sao chép link này vào trình duyệt:</td>
</tr>
<tr>
<td style="padding-top:8px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td bgcolor="#f4f5f7" style="background-color:#f4f5f7;border-radius:4px;padding:10px 12px;font-family:Courier New,Courier,monospace;font-size:12px;line-height:18px;color:#0052cc;word-break:break-all;">${safeLink}</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#5e6c84;padding:16px 16px 0 16px;">Không phải bạn mong đợi email này? Bỏ qua nó, lời mời sẽ tự hết hạn.<br>Email tự động từ Smart Things, vui lòng không trả lời.</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  const text = [
    `${inviterName} đã mời bạn vào hệ thống quản lý dự án Smart Things với vai trò ${roleName}.`,
    `Đăng nhập bằng đúng email này (Google hoặc tạo mật khẩu) để bắt đầu. Link có hiệu lực ${ttlDays} ngày và chỉ dùng được cho email này:`,
    link,
    'Không phải bạn mong đợi email này? Bỏ qua nó, lời mời sẽ tự hết hạn.',
  ].join('\n\n');

  return { subject, html, text };
}
