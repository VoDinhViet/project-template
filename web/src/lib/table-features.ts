import {
  columnVisibilityFeature,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/react-table'

/**
 * Một bộ feature dùng chung cho mọi bảng (`useTable` + `createColumnHelper`).
 *
 * Rules:
 * - v9 chỉ cho gọi `row.getVisibleCells()` khi có `columnVisibilityFeature`, dù không bảng nào ẩn cột.
 * - Sắp xếp, lọc, phân trang làm phía server hoặc ở page qua search params, nên không bật row model
 *   phía client; `rowSortingFeature` chỉ để header đọc và đổi trạng thái sắp (`manualSorting`).
 */
export const appTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowSortingFeature,
})
