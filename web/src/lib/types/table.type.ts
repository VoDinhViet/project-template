import type { CellData, RowData, TableFeatures } from '@tanstack/react-table'

// Mỗi cột tự khai class của header/ô trong `columnDef.meta`, không rẽ nhánh theo `column.id`.
// Module augmentation bắt buộc dùng `interface`; v9 thêm generic `TFeatures` đứng đầu.
declare module '@tanstack/react-table' {
  interface ColumnMeta<
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData = CellData,
  > {
    headerClassName?: string
    cellClassName?: string
  }

  /** Cột là hằng cấp module nên hành động cần dữ liệu của page (mở chi tiết) đi qua `options.meta`. */
  interface TableMeta<TFeatures extends TableFeatures, TData extends RowData> {
    onRowOpen?: (rowData: TData) => void
  }
}
