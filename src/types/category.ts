export type CategorySortField = 'createdAt' | 'updatedAt' | 'name';

export type SortOrder = 'ASC' | 'DESC';

export interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FindAllCategoriesQuery {
  page?: number;
  limit?: number;
  sortOrder?: SortOrder;
  search?: string;
  sortBy?: CategorySortField;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string | null;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface FindAllCategoriesResponse extends ApiResponse<Category[]> {
  meta: PaginationMeta;
}

export interface DeleteCategoryData {
  id: number;
  deleted: boolean;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
  path?: string;
  timestamp?: string;
}