import {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  MAX_PAGE_NUMBER,
  MAX_SEARCH_KEYWORD_LENGTH,
  Order,
} from '../../../constants/app.constant.js';
import {
  EnumFieldOptional,
  NumberFieldOptional,
  StringFieldOptional,
} from '../../../decorators/field.decorators.js';

/** Query phân trang gốc; danh sách của từng domain kế thừa lớp này. */
export class PageOptionsDto {
  @NumberFieldOptional({
    min: 1,
    max: MAX_PAGE_LIMIT,
    int: true,
    description: `Số dòng mỗi trang (tối đa ${MAX_PAGE_LIMIT})`,
  })
  readonly limit: number = DEFAULT_PAGE_LIMIT;

  @NumberFieldOptional({
    min: 1,
    max: MAX_PAGE_NUMBER,
    int: true,
    description: 'Trang hiện tại',
  })
  readonly page: number = 1;

  @StringFieldOptional({
    maxLength: MAX_SEARCH_KEYWORD_LENGTH,
    description: 'Từ khoá tìm kiếm',
  })
  readonly q?: string;

  @EnumFieldOptional(() => Order, {
    enumName: 'Order',
    description: 'Chiều sắp xếp',
  })
  readonly order: Order = Order.ASC;

  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}
