export type UnitType = { name: string; rate: number; default?: boolean }

export enum ProductType {
  // Inherit = 0, // Dùng theo cấu hình mặc định hệ thống
  Basic = 1,
  SplitBatch = 2,
}

export const ProductTypeText = {
  [ProductType.Basic]: 'Sản phẩm thường',
  [ProductType.SplitBatch]: 'Sản phẩm có lô',
}

export enum SplitBatchByWarehouse {
  // Inherit = 0,
  Override = 1,
  SplitOnDifferent = 2,
}

export const SplitBatchByWarehouseText = {
  [SplitBatchByWarehouse.Override]: 'Không phân biệt giữa các lô',
  [SplitBatchByWarehouse.SplitOnDifferent]: 'Phân biệt giữa các lô',
}

export enum SplitBatchByDistributor {
  // Inherit = 0,
  Override = 1,
  SplitOnDifferent = 2,
}

export const SplitBatchByDistributorText = {
  [SplitBatchByDistributor.Override]: 'Không phân biệt giữa các lô',
  [SplitBatchByDistributor.SplitOnDifferent]: 'Phân biệt giữa các lô',
}

export enum SplitBatchByExpiryDate {
  // Inherit = 0,
  Override = 1,
  SplitOnDifferent = 2,
}

export const SplitBatchByExpiryDateText = {
  [SplitBatchByExpiryDate.Override]: 'Không phân biệt giữa các lô',
  [SplitBatchByExpiryDate.SplitOnDifferent]: 'Phân biệt giữa các lô',
}

export enum SplitBatchByCostPrice {
  // Inherit = 0,
  OverrideAndMAC = 1,
  SplitOnDifferent = 2,
}

export const SplitBatchByCostPriceText = {
  [SplitBatchByCostPrice.OverrideAndMAC]: 'Ghi đè giá nhập cũ, giá vốn sử dụng công thức tính bình quân gia quyền',
  [SplitBatchByCostPrice.SplitOnDifferent]: 'Phân biệt giữa các lô',
}