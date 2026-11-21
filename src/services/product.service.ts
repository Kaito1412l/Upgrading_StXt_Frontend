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
  CreateProductPayload,
  DeleteProductData,
  FindAllProductsQuery,
  FindAllProductsResponse,
  InventorySummary,
  Product,
  UpdateProductPayload,
  UpdateProductStockPayload,
} from '@/types/product';

const PRODUCTS_ENDPOINT = '/v1/products';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (query: FindAllProductsQuery = {}) =>
    [
      ...productKeys.lists(),
      {
        page: query.page ?? 1,
        limit: query.limit ?? 9,
        sortBy: query.sortBy ?? 'createdAt',
        sortOrder: query.sortOrder ?? 'DESC',
        categoryId: query.categoryId ?? 'ALL',
        search: query.search?.trim() ?? '',
      },
    ] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
  summary: () => [...productKeys.all, 'summary'] as const,
};

export const productService = {
  findAll(
    query: FindAllProductsQuery = {},
    signal?: AbortSignal,
  ): Promise<FindAllProductsResponse> {
    const qs = buildQueryString({
      page: query.page,
      limit: query.limit,
      sortOrder: query.sortOrder,
      categoryId: query.categoryId,
      search: query.search?.trim() || undefined,
      sortBy: query.sortBy,
    });
    return apiFetch<FindAllProductsResponse>(`${PRODUCTS_ENDPOINT}${qs}`, {
      method: 'GET',
      signal,
    });
  },

  findById(id: number, signal?: AbortSignal): Promise<ApiResponse<Product>> {
    return apiFetch<ApiResponse<Product>>(
      `${PRODUCTS_ENDPOINT}/${encodeURIComponent(id)}`,
      { method: 'GET', signal },
    );
  },

  getSummary(signal?: AbortSignal): Promise<ApiResponse<InventorySummary>> {
    return apiFetch<ApiResponse<InventorySummary>>(
      `${PRODUCTS_ENDPOINT}/summary`,
      { method: 'GET', signal },
    );
  },

  create(payload: CreateProductPayload): Promise<ApiResponse<Product>> {
    return apiFetch<ApiResponse<Product>>(PRODUCTS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(
    id: number,
    payload: UpdateProductPayload,
  ): Promise<ApiResponse<Product>> {
    return apiFetch<ApiResponse<Product>>(
      `${PRODUCTS_ENDPOINT}/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
    );
  },

  updateStock(
    id: number,
    payload: UpdateProductStockPayload,
  ): Promise<ApiResponse<Product>> {
    return apiFetch<ApiResponse<Product>>(
      `${PRODUCTS_ENDPOINT}/${encodeURIComponent(id)}/stock`,
      { method: 'PATCH', body: JSON.stringify(payload) },
    );
  },

  remove(id: number): Promise<ApiResponse<DeleteProductData>> {
    return apiFetch<ApiResponse<DeleteProductData>>(
      `${PRODUCTS_ENDPOINT}/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
  },
};

export const productQueryOptions = {
  list: (query: FindAllProductsQuery = {}) =>
    queryOptions({
      queryKey: productKeys.list(query),
      queryFn: ({ signal }) => productService.findAll(query, signal),
      placeholderData: keepPreviousData,
    }),

  detail: (id: number) =>
    queryOptions({
      queryKey: productKeys.detail(id),
      queryFn: ({ signal }) => productService.findById(id, signal),
      enabled: id > 0,
    }),

  summary: () =>
    queryOptions({
      queryKey: productKeys.summary(),
      queryFn: ({ signal }) => productService.getSummary(signal),
    }),
};

export function useProductsQuery(query: FindAllProductsQuery = {}) {
  return useQuery(productQueryOptions.list(query));
}

export function useInventorySummaryQuery() {
  return useQuery(productQueryOptions.summary());
}

export function useProductDetailQuery(id: number | null) {
  return useQuery({
    ...productQueryOptions.detail(id ?? 0),
    enabled: typeof id === 'number' && id > 0,
  });
}

export function usePrefetchProductDetail() {
  const queryClient = useQueryClient();
  return (id: number) => {
    void queryClient.prefetchQuery(productQueryOptions.detail(id));
  };
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...productKeys.all, 'create'] as const,
    mutationFn: (payload: CreateProductPayload) =>
      productService.create(payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(productKeys.detail(response.data.id), response);
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...productKeys.all, 'update'] as const,
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateProductPayload;
    }) => productService.update(id, payload),
    onSuccess: async (response, { id }) => {
      queryClient.setQueryData(productKeys.detail(id), response);
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateProductStockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...productKeys.all, 'update-stock'] as const,
    mutationFn: ({ id, stock }: { id: number; stock: number }) =>
      productService.updateStock(id, { stock }),
    onMutate: async ({ id, stock }) => {
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });
      const previousLists = queryClient.getQueriesData<FindAllProductsResponse>({
        queryKey: productKeys.lists(),
      });

      for (const [key, snapshot] of previousLists) {
        if (!snapshot) continue;
        queryClient.setQueryData<FindAllProductsResponse>(key, {
          ...snapshot,
          data: snapshot.data.map((product) =>
            product.id === id ? { ...product, stock } : product,
          ),
        });
      }

      return { previousLists };
    },
    onError: (_error, _variables, context) => {
      if (!context?.previousLists) return;
      for (const [key, snapshot] of context.previousLists) {
        queryClient.setQueryData(key, snapshot);
      }
    },
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(productKeys.detail(id), response);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...productKeys.all, 'delete'] as const,
    mutationFn: (id: number) => productService.remove(id),
    onSuccess: async (_response, id) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}