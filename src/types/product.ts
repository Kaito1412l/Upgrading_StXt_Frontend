import type {
  ApiErrorResponse,
  ApiResponse,
  Category,
  PaginationMeta,
  SortOrder,
} from './category';

export type {
  ApiErrorResponse,
  ApiResponse,
  Category,
  PaginationMeta,
  SortOrder,
};

export type ProductSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'price'
  | 'stock';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  categoryId: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface FindAllProductsQuery {
  page?: number;
  limit?: number;
  sortOrder?: SortOrder;
  categoryId?: number;
  search?: string;
  sortBy?: ProductSortField;
}

export interface CreateProductPayload {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  categoryId: number;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  categoryId?: number;
}

export interface UpdateProductStockPayload {
  stock: number;
}

export interface FindAllProductsResponse extends ApiResponse<Product[]> {
  meta: PaginationMeta;
}

export interface DeleteProductData {
  id: number;
  deleted: boolean;
}

export interface InventorySummary {
  totalProductTypes: number;
  totalStock: number;
}