# Comment

- Comment **chỉ để giải thích tại sao** (ràng buộc ẩn, lý do chọn cách này, bẫy dễ dính), **không** nhắc lại code làm gì.
- Viết bằng **tiếng Việt**; tên identifier (hàm, cột, biến) đặt trong dấu backtick: `` `deletedAt` ``.
- Một ràng buộc: một dòng `//` (trong thân hàm) hoặc `/** ... */` một dòng (trên khai báo). Không dùng dòng phân cách kiểu `// ---- X ----`. Nhiều ràng buộc: câu tóm tắt, dòng trống, rồi `Rules:` với gạch đầu dòng.

  ```ts
  /**
   * Số chứng từ phải sinh trong cùng transaction với bản ghi tạo ra nó.
   *
   * Rules:
   * - Dùng `generateDocumentSequence(tx, ...)`, không gọi ngoài transaction.
   * - Năm lấy theo giờ Việt Nam, không theo UTC.
   */
  ```

- Không dùng `@param`, `@returns`, `@throws`.
- Không ghi changelog, tên người sửa, mã ticket hay ngày trong comment. Nếu đảo ngược một quyết định có chủ đích, ghi ngày và lý do.
- **Không comment trên controller và field của DTO**: mô tả API đặt trong `description` của decorator (`@ApiOperation`, `StringField({ description })`).
- Thay vì giải thích dài, trỏ tới nơi chứa quy tắc: `Xem backend/database.md`.
- Ngắt dòng khoảng 100 ký tự.
- Xoá code chết, không comment lại code cũ.
- Ngoại lệ: chữ hiển thị trên UI không phải comment, vẫn viết tiếng Việt như bình thường.

## Checklist

- [ ] Mỗi comment trả lời "tại sao", không phải "cái gì".
- [ ] Identifier trong backtick, không có `@param`/`@returns`.
- [ ] Không có comment trên controller/field DTO.
