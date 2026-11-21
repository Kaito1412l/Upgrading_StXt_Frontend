import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiFetch, buildQueryString } from '@/lib/api-client';
import type {
  ApiResponse,
  Category,
  CreateCategoryPayload,
  DeleteCategoryData,
  FindAllCategoriesQuery,
  FindAllCategoriesResponse,
  UpdateCategoryPayload,
} from '@/types/category';

const CATEGORIES_ENDPOINT = '/v1/categories';

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (query: FindAllCategoriesQuery = {}) =>
    [
      ...categoryKeys.lists(),
      {
        page: query.page ?? 1,
        limit: query.limit ?? 50,
        sortBy: query.sortBy ?? 'createdAt',
        sortOrder: query.sortOrder ?? 'DESC',
        search: query.search?.trim() ?? '',
      },
    ] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
};

export const categoryService = {
  findAll(
    query: FindAllCategoriesQuery = {},
    signal?: AbortSignal,
  ): Promise<FindAllCategoriesResponse> {
    const qs = buildQueryString({
      page: query.page,
      limit: query.limit,
      sortOrder: query.sortOrder,
      search: query.search?.trim() || undefined,
      sortBy: query.sortBy,
    });
    return apiFetch<FindAllCategoriesResponse>(`${CATEGORIES_ENDPOINT}${qs}`, {
      method: 'GET',
      signal,
    });
  },

  findById(id: number, signal?: AbortSignal): Promise<ApiResponse<Category>> {
    return apiFetch<ApiResponse<Category>>(
      `${CATEGORIES_ENDPOINT}/${encodeURIComponent(id)}`,
      { method: 'GET', signal },
    );
  },

  create(payload: CreateCategoryPayload): Promise<ApiResponse<Category>> {
    return apiFetch<ApiResponse<Category>>(CATEGORIES_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(
    id: number,
    payload: UpdateCategoryPayload,
  ): Promise<ApiResponse<Category>> {
    return apiFetch<ApiResponse<Category>>(
      `${CATEGORIES_ENDPOINT}/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
    );
  },

  remove(id: number): Promise<ApiResponse<DeleteCategoryData>> {
    return apiFetch<ApiResponse<DeleteCategoryData>>(
      `${CATEGORIES_ENDPOINT}/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
  },
};

export const categoryQueryOptions = {
  list: (query: FindAllCategoriesQuery = {}) =>
    queryOptions({
      queryKey: categoryKeys.list(query),
      queryFn: ({ signal }) => categoryService.findAll(query, signal),
      placeholderData: keepPreviousData,
    }),

  detail: (id: number) =>
    queryOptions({
      queryKey: categoryKeys.detail(id),
      queryFn: ({ signal }) => categoryService.findById(id, signal),
      enabled: id > 0,
    }),
};

export function useCategoriesQuery(query: FindAllCategoriesQuery = {}) {
  return useQuery(categoryQueryOptions.list(query));
}

export function useCategoryDetailQuery(id: number | null) {
  return useQuery({
    ...categoryQueryOptions.detail(id ?? 0),
    enabled: typeof id === 'number' && id > 0,
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...categoryKeys.all, 'create'] as const,
    mutationFn: (payload: CreateCategoryPayload) =>
      categoryService.create(payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(categoryKeys.detail(response.data.id), response);
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...categoryKeys.all, 'update'] as const,
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateCategoryPayload;
    }) => categoryService.update(id, payload),
    onSuccess: async (response, { id }) => {
      queryClient.setQueryData(categoryKeys.detail(id), response);
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...categoryKeys.all, 'delete'] as const,
    mutationFn: (id: number) => categoryService.remove(id),
    onSuccess: async (_response, id) => {
      queryClient.removeQueries({ queryKey: categoryKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}