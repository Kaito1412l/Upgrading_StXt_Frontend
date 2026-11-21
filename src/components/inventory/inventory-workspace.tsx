'use client';

import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronLeft,
  ChevronRight,
  Filter,
  FolderKanban,
  LayoutGrid,
  Plus,
  RefreshCw,
  Search,
  Table2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useId, useState } from 'react';
import { CategoryFormDialog } from '@/components/inventory/category-form-dialog';
import { DeleteProductDialog } from '@/components/inventory/delete-product-dialog';
import { ProductCard } from '@/components/inventory/product-card';
import { ProductDetailDialog } from '@/components/inventory/product-detail-dialog';
import { ProductFormDialog } from '@/components/inventory/product-form-dialog';
import { ProductTable } from '@/components/inventory/product-table';
import { UpdateStockDialog } from '@/components/inventory/update-stock-dialog';
import { AppFooter } from '@/components/layout/app-footer';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCategoriesQuery } from '@/hooks/use-categories';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  useInventorySummaryQuery,
  useProductsQuery,
} from '@/hooks/use-products';
import { cn } from '@/lib/utils';
import type {
  FindAllProductsQuery,
  Product,
  ProductSortField,
  SortOrder,
} from '@/types/product';

type CategoryFilter = 'ALL' | number;
type ViewMode = 'table' | 'cards';

const SORT_FIELD_OPTIONS: Array<{ value: ProductSortField; label: string }> = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'name', label: 'Product Name' },
  { value: 'price', label: 'Price' },
  { value: 'stock', label: 'Stock' },
];

const SORT_FIELD_ITEMS = Object.fromEntries(
  SORT_FIELD_OPTIONS.map((item) => [item.value, item.label]),
);

const PAGE_SIZE_OPTIONS = [6, 9, 12, 24] as const;
const PAGE_SIZE_ITEMS = Object.fromEntries(
  PAGE_SIZE_OPTIONS.map((size) => [String(size), `${size} rows`]),
);

function parseCategoryParam(raw: string | null): CategoryFilter {
  if (!raw || raw === 'ALL') return 'ALL';
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 'ALL';
}

function parseSortFieldParam(raw: string | null): ProductSortField {
  const valid = SORT_FIELD_OPTIONS.some((item) => item.value === raw);
  return valid ? (raw as ProductSortField) : 'createdAt';
}

export function InventoryWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialCategory = parseCategoryParam(searchParams.get('categoryId'));
  const initialPage = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const initialSortBy = parseSortFieldParam(searchParams.get('sortBy'));
  const initialSortOrder: SortOrder =
    searchParams.get('sortOrder')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const initialSearch = searchParams.get('search') ?? '';

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState<number>(9);
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>(initialCategory);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<ProductSortField>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  const [formState, setFormState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    product: Product | null;
  }>({ open: false, mode: 'create', product: null });
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const searchInputId = useId();
  const sortById = useId();
  const pageSizeId = useId();

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const syncUrlParams = useCallback(
    (next: {
      page?: number;
      categoryId?: CategoryFilter;
      sortBy?: ProductSortField;
      sortOrder?: SortOrder;
      search?: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextPage = next.page ?? page;
      const nextCategory = next.categoryId ?? categoryFilter;
      const nextSortBy = next.sortBy ?? sortBy;
      const nextSortOrder = next.sortOrder ?? sortOrder;
      const nextSearch = (next.search ?? searchInput).trim();

      if (nextPage > 1) params.set('page', String(nextPage));
      else params.delete('page');

      if (nextCategory !== 'ALL') params.set('categoryId', String(nextCategory));
      else params.delete('categoryId');

      if (nextSortBy !== 'createdAt') params.set('sortBy', nextSortBy);
      else params.delete('sortBy');

      if (nextSortOrder !== 'DESC') params.set('sortOrder', nextSortOrder);
      else params.delete('sortOrder');

      if (nextSearch) params.set('search', nextSearch);
      else params.delete('search');

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [
      categoryFilter,
      page,
      pathname,
      router,
      searchInput,
      searchParams,
      sortBy,
      sortOrder,
    ],
  );

  const queryParams: FindAllProductsQuery = {
    page,
    limit,
    sortBy,
    sortOrder,
    categoryId: categoryFilter === 'ALL' ? undefined : categoryFilter,
    search: debouncedSearch.trim() || undefined,
  };

  const productsQuery = useProductsQuery(queryParams);
  const summaryQuery = useInventorySummaryQuery();
  const categoriesQuery = useCategoriesQuery({ page: 1, limit: 100 });

  const products = productsQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];
  const meta = productsQuery.data?.meta ?? {
    page,
    limit,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const summary = summaryQuery.data?.data ?? {
    totalProductTypes: meta.totalItems,
    totalStock: 0,
  };

  const lowStockCount = products.filter(
    (item) => item.stock > 0 && item.stock <= 5,
  ).length;
  const outOfStockCount = products.filter((item) => item.stock <= 0).length;

  const announce = useCallback((message: string) => {
    setLiveAnnouncement('');
    window.setTimeout(() => {
      setLiveAnnouncement(message);
    }, 30);
  }, []);

  const handleCategoryFilterChange = (nextCategory: CategoryFilter) => {
    setCategoryFilter(nextCategory);
    setPage(1);
    syncUrlParams({ categoryId: nextCategory, page: 1 });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
    syncUrlParams({ search: value, page: 1 });
  };

  const handleRefresh = () => {
    void Promise.all([
      productsQuery.refetch(),
      summaryQuery.refetch(),
      categoriesQuery.refetch(),
    ]);
    announce('Refreshing inventory data.');
  };

  const openCreateModal = () => {
    setFormState({ open: true, mode: 'create', product: null });
  };

  const openEditModal = (product: Product) => {
    setFormState({ open: true, mode: 'edit', product });
  };

  const selectedCategoryObj =
    categoryFilter === 'ALL'
      ? undefined
      : categories.find((cat) => cat.id === categoryFilter);

  const activeCategoryLabel =
    categoryFilter === 'ALL'
      ? 'All Categories'
      : (selectedCategoryObj?.name ?? `Category #${categoryFilter}`);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--apple-canvas)] text-[var(--apple-ink)]">
      <a
        href="#main-content"
        className="visually-hidden fixed top-2 left-2 z-50 rounded-full bg-[var(--apple-primary)] px-4 py-2 text-[14px] font-semibold text-white"
      >
        Skip to main content
      </a>

      <main className="flex-1">
        {/* Overview & Inventory Summary */}
        <section
          id="overview"
          className="w-full border-b border-[var(--apple-divider-soft)] bg-[var(--apple-canvas)] px-4 py-8 text-[var(--apple-ink)] sm:px-6 sm:py-10 lg:px-8"
        >
          <div className="mx-auto max-w-[1440px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1
                  id="main-content"
                  tabIndex={-1}
                  className="text-[clamp(1.75rem,1.2rem+1.6vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.015em] text-[var(--apple-ink)]"
                >
                  Inventory Management
                </h1>
                <p className="mt-1 text-[17px] leading-[1.47] tracking-[-0.374px] text-[var(--apple-ink-muted-80)]">
                  Pantau jumlah jenis barang dan total stok, atau kelola{' '}
                  <Link
                    href="/categories"
                    className="text-[var(--apple-primary)] hover:underline"
                  >
                    kategori barang
                  </Link>{' '}
                  dan{' '}
                  <Link
                    href="/analytics"
                    className="text-[var(--apple-primary)] hover:underline"
                  >
                    ringkasan inventaris
                  </Link>
                  .
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {categoryFilter !== 'ALL' ? (
                  <button
                    type="button"
                    onClick={() => handleCategoryFilterChange('ALL')}
                    className="inline-flex min-h-11 cursor-pointer items-center text-[15px] leading-[1.47] tracking-[-0.374px] text-[var(--apple-primary)] hover:underline"
                  >
                    Show all categories
                  </button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryDialogOpen(true)}
                >
                  <FolderKanban aria-hidden="true" className="size-4" />
                  <span>New Category</span>
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={openCreateModal}
                >
                  <Plus aria-hidden="true" className="size-4" />
                  <span>New Product</span>
                </Button>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                aria-pressed={categoryFilter === 'ALL'}
                onClick={() => handleCategoryFilterChange('ALL')}
                className={cn(
                  'flex min-h-[120px] cursor-pointer flex-col justify-between rounded-[18px] border p-5 text-left transition-all duration-150 active:scale-[0.98]',
                  categoryFilter === 'ALL'
                    ? 'border-2 border-[var(--apple-primary)] bg-[var(--apple-primary)]/[0.04]'
                    : 'border-[var(--apple-hairline)] bg-[var(--apple-canvas-parchment)] hover:bg-[var(--apple-divider-soft)]',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold tracking-[-0.224px] text-[var(--apple-ink-muted-80)]">
                    Total Jenis Barang
                  </span>
                  {categoryFilter === 'ALL' ? (
                    <span className="rounded-full bg-[var(--apple-primary)]/10 px-2.5 py-0.5 text-[12px] font-semibold text-[var(--apple-primary)]">
                      All
                    </span>
                  ) : null}
                </div>
                <div className="mt-3">
                  {summaryQuery.isPending && !summaryQuery.data ? (
                    <div
                      aria-hidden="true"
                      className="h-10 w-16 animate-pulse rounded-[8px] bg-[var(--apple-divider-soft)]"
                    />
                  ) : (
                    <p className="text-[38px] leading-none font-semibold tracking-[-0.02em] text-[var(--apple-ink)] tabular-nums">
                      {summary.totalProductTypes}
                    </p>
                  )}
                  <p className="mt-2 text-[14px] leading-[1.43] tracking-[-0.224px] text-[var(--apple-ink-muted-48)]">
                    Jenis produk terdaftar
                  </p>
                </div>
              </button>

              <div className="flex min-h-[120px] flex-col justify-between rounded-[18px] border border-[var(--apple-hairline)] bg-[var(--apple-canvas-parchment)] p-5">
                <span className="text-[14px] font-semibold tracking-[-0.224px] text-[var(--apple-ink-muted-80)]">
                  Total Stok Barang
                </span>
                <div className="mt-3">
                  {summaryQuery.isPending && !summaryQuery.data ? (
                    <div
                      aria-hidden="true"
                      className="h-10 w-20 animate-pulse rounded-[8px] bg-[var(--apple-divider-soft)]"
                    />
                  ) : (
                    <p className="text-[38px] leading-none font-semibold tracking-[-0.02em] text-[var(--apple-ink)] tabular-nums">
                      {summary.totalStock}
                    </p>
                  )}
                  <p className="mt-2 text-[14px] leading-[1.43] tracking-[-0.224px] text-[var(--apple-ink-muted-48)]">
                    Akumulasi unit tersedia
                  </p>
                </div>
              </div>

              <div className="flex min-h-[120px] flex-col justify-between rounded-[18px] border border-[var(--apple-hairline)] bg-[var(--apple-canvas-parchment)] p-5">
                <span className="text-[14px] font-semibold tracking-[-0.224px] text-[var(--apple-ink-muted-80)]">
                  Low Stock (Halaman Ini)
                </span>
                <div className="mt-3">
                  <p className="text-[38px] leading-none font-semibold tracking-[-0.02em] text-[var(--apple-ink)] tabular-nums">
                    {lowStockCount}
                  </p>
                  <p className="mt-2 text-[14px] leading-[1.43] tracking-[-0.224px] text-[var(--apple-ink-muted-48)]">
                    Stok 1 sampai 5 unit
                  </p>
                </div>
              </div>

              <div className="flex min-h-[120px] flex-col justify-between rounded-[18px] border border-[var(--apple-hairline)] bg-[var(--apple-canvas-parchment)] p-5">
                <span className="text-[14px] font-semibold tracking-[-0.224px] text-[var(--apple-ink-muted-80)]">
                  Out of Stock (Halaman Ini)
                </span>
                <div className="mt-3">
                  <p className="text-[38px] leading-none font-semibold tracking-[-0.02em] text-[var(--apple-ink)] tabular-nums">
                    {outOfStockCount}
                  </p>
                  <p className="mt-2 text-[14px] leading-[1.43] tracking-[-0.224px] text-[var(--apple-ink-muted-48)]">
                    Stok 0 unit
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workspace Section */}
        <section
          id="workspace"
          className="w-full rounded-none bg-[var(--apple-canvas)] px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
        >
          <div className="mx-auto max-w-[1440px] space-y-6">
            <Tabs
              value={viewMode}
              onValueChange={(val) => {
                if (val === 'table' || val === 'cards') {
                  setViewMode(val);
                }
              }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[24px] leading-[1.2] font-semibold tracking-[-0.374px] text-[var(--apple-ink)]">
                    Products
                  </h2>
                  <p className="mt-0.5 text-[14px] leading-[1.43] tracking-[-0.224px] text-[var(--apple-ink-muted-48)]">
                    Showing {products.length} of {meta.totalItems}{' '}
                    {meta.totalItems === 1 ? 'product' : 'products'}
                    {categoryFilter !== 'ALL'
                      ? ` in ${activeCategoryLabel}`
                      : ''}
                    .
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <TabsList aria-label="Choose view layout">
                    <TabsTrigger value="table">
                      <Table2 aria-hidden="true" />
                      <span>Table</span>
                    </TabsTrigger>
                    <TabsTrigger value="cards">
                      <LayoutGrid aria-hidden="true" />
                      <span>Cards</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Search, Category Filter & Sort Toolbar */}
              <div className="flex flex-col gap-4 rounded-[18px] border border-[var(--apple-hairline)] bg-[var(--apple-canvas)] p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-md">
                    <label htmlFor={searchInputId} className="visually-hidden">
                      Search products by name, description, or category
                    </label>
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--apple-ink-muted-48)]"
                    />
                    <input
                      id={searchInputId}
                      type="search"
                      value={searchInput}
                      onChange={(event) =>
                        handleSearchChange(event.target.value)
                      }
                      placeholder="Search product or category..."
                      className="h-11 w-full rounded-full border border-[rgb(0_0_0_/_0.08)] bg-[var(--apple-canvas-parchment)] py-2.5 pr-11 pl-11 text-[17px] leading-[1.47] font-normal tracking-[-0.374px] text-[var(--apple-ink)] placeholder:text-[var(--apple-ink-muted-48)]"
                    />
                    {searchInput ? (
                      <button
                        type="button"
                        aria-label="Clear search query"
                        onClick={() => handleSearchChange('')}
                        className="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[var(--apple-ink-muted-48)] hover:bg-[var(--apple-divider-soft)] hover:text-[var(--apple-ink)]"
                      >
                        <X aria-hidden="true" className="size-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--apple-hairline)] bg-[var(--apple-canvas)] px-4 py-2 text-[14px] leading-[1.29] tracking-[-0.224px] text-[var(--apple-ink)] transition-transform duration-150 hover:bg-[var(--apple-canvas-parchment)] active:scale-95">
                        <Filter
                          aria-hidden="true"
                          className="size-4 text-[var(--apple-primary)]"
                        />
                        <span>Category: {activeCategoryLabel}</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>
                            Filter by Category
                          </DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value={String(categoryFilter)}
                            onValueChange={(val) =>
                              handleCategoryFilterChange(parseCategoryParam(val))
                            }
                          >
                            <DropdownMenuRadioItem value="ALL">
                              All Categories
                            </DropdownMenuRadioItem>
                            {categories.map((cat) => (
                              <DropdownMenuRadioItem
                                key={cat.id}
                                value={String(cat.id)}
                              >
                                {cat.name}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={sortById}
                        className="text-[14px] font-semibold tracking-[-0.224px] text-[var(--apple-ink-muted-80)]"
                      >
                        Sort
                      </label>
                      <div className="w-44">
                        <Select
                          id={sortById}
                          value={sortBy}
                          items={SORT_FIELD_ITEMS}
                          onValueChange={(nextVal) => {
                            if (nextVal) {
                              const nextSortBy = nextVal as ProductSortField;
                              setSortBy(nextSortBy);
                              setPage(1);
                              syncUrlParams({ sortBy: nextSortBy, page: 1 });
                            }
                          }}
                        >
                          <SelectTrigger id={sortById}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SORT_FIELD_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={
                        sortOrder === 'DESC'
                          ? 'Sort descending. Switch to ascending'
                          : 'Sort ascending. Switch to descending'
                      }
                      onClick={() => {
                        const nextOrder: SortOrder =
                          sortOrder === 'DESC' ? 'ASC' : 'DESC';
                        setSortOrder(nextOrder);
                        setPage(1);
                        syncUrlParams({ sortOrder: nextOrder, page: 1 });
                      }}
                    >
                      {sortOrder === 'DESC' ? (
                        <>
                          <ArrowDownWideNarrow
                            aria-hidden="true"
                            className="size-4"
                          />
                          <span>Desc</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpNarrowWide
                            aria-hidden="true"
                            className="size-4"
                          />
                          <span>Asc</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Error State */}
              {productsQuery.isError ? (
                <div
                  role="alert"
                  className="flex flex-col items-start justify-between gap-4 rounded-[18px] border border-[#c92a2a]/25 bg-[var(--apple-canvas)] p-6 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-[#c92a2a]"
                    />
                    <div className="space-y-1">
                      <h3 className="text-[17px] font-semibold tracking-[-0.374px] text-[var(--apple-ink)]">
                        Unable to load products
                      </h3>
                      <p className="text-[14px] leading-[1.43] text-[var(--apple-ink-muted-80)]">
                        {productsQuery.error instanceof Error
                          ? productsQuery.error.message
                          : 'An unexpected error occurred while contacting the API.'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleRefresh}
                  >
                    <RefreshCw aria-hidden="true" className="size-4" />
                    <span>Try Again</span>
                  </Button>
                </div>
              ) : null}

              {/* Content */}
              {productsQuery.isPending ? (
                <div
                  aria-label="Loading products"
                  className="space-y-3 rounded-[18px] border border-[var(--apple-hairline)] bg-[var(--apple-canvas)] p-6"
                >
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="h-14 w-full rounded-[11px]"
                    />
                  ))}
                </div>
              ) : products.length === 0 && !productsQuery.isError ? (
                <div className="flex flex-col items-center justify-center rounded-[18px] border border-[var(--apple-hairline)] bg-[var(--apple-canvas)] px-6 py-16 text-center">
                  <h3 className="text-[21px] leading-[1.19] font-semibold tracking-[0.231px] text-[var(--apple-ink)]">
                    {debouncedSearch.trim() || categoryFilter !== 'ALL'
                      ? 'No matching products found'
                      : 'Your inventory is empty'}
                  </h3>
                  <p className="mt-2 max-w-md text-[17px] leading-[1.47] tracking-[-0.374px] text-[var(--apple-ink-muted-48)]">
                    {debouncedSearch.trim() || categoryFilter !== 'ALL'
                      ? 'Try adjusting your search keywords or switching back to all categories.'
                      : 'Create a category and add your first product to start tracking stock.'}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {debouncedSearch.trim() || categoryFilter !== 'ALL' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSearchInput('');
                          setCategoryFilter('ALL');
                          setPage(1);
                          syncUrlParams({
                            search: '',
                            categoryId: 'ALL',
                            page: 1,
                          });
                        }}
                      >
                        Reset Filters
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={openCreateModal}
                    >
                      <Plus aria-hidden="true" className="size-4" />
                      <span>Create Product</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <TabsContent
                    value="table"
                    className={
                      productsQuery.isPlaceholderData ? 'opacity-70' : undefined
                    }
                  >
                    <ProductTable
                      products={products}
                      onView={(item) => setDetailProduct(item)}
                      onUpdateStock={(item) => setStockProduct(item)}
                      onEdit={openEditModal}
                      onDelete={(item) => setDeleteProduct(item)}
                    />
                  </TabsContent>

                  <TabsContent
                    value="cards"
                    className={
                      productsQuery.isPlaceholderData ? 'opacity-70' : undefined
                    }
                  >
                    <ul
                      role="list"
                      className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
                    >
                      {products.map((product) => (
                        <li key={product.id} className="h-full">
                          <ProductCard
                            product={product}
                            onView={(item) => setDetailProduct(item)}
                            onUpdateStock={(item) => setStockProduct(item)}
                            onEdit={openEditModal}
                            onDelete={(item) => setDeleteProduct(item)}
                          />
                        </li>
                      ))}
                    </ul>
                  </TabsContent>
                </>
              )}
            </Tabs>

            {/* Pagination Bar */}
            <nav
              aria-label="Pagination"
              className="flex flex-col items-center justify-between gap-4 rounded-[18px] border border-[var(--apple-hairline)] bg-[var(--apple-canvas)] px-5 py-4 sm:flex-row"
            >
              <div className="flex items-center gap-3">
                <label
                  htmlFor={pageSizeId}
                  className="text-[14px] tracking-[-0.224px] text-[var(--apple-ink-muted-48)]"
                >
                  Per page
                </label>
                <div className="w-28">
                  <Select
                    id={pageSizeId}
                    value={String(limit)}
                    items={PAGE_SIZE_ITEMS}
                    onValueChange={(nextVal) => {
                      if (nextVal) {
                        const nextLimit = Number(nextVal);
                        setLimit(nextLimit);
                        setPage(1);
                        syncUrlParams({ page: 1 });
                      }
                    }}
                  >
                    <SelectTrigger id={pageSizeId}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size} rows
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[14px] tracking-[-0.224px] text-[var(--apple-ink-muted-80)] tabular-nums">
                  Page {meta.page} of {Math.max(1, meta.totalPages)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPreviousPage}
                  onClick={() => {
                    const prevPage = Math.max(1, page - 1);
                    setPage(prevPage);
                    syncUrlParams({ page: prevPage });
                  }}
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNextPage}
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    syncUrlParams({ page: nextPage });
                  }}
                >
                  <span>Next</span>
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </nav>
          </div>
        </section>
      </main>

      <AppFooter />
      <AppHeader
        onNewProduct={openCreateModal}
        onNewCategory={() => setCategoryDialogOpen(true)}
        onSync={handleRefresh}
        isSyncing={productsQuery.isFetching || summaryQuery.isFetching}
      />

      <ProductFormDialog
        open={formState.open}
        mode={formState.mode}
        product={formState.product}
        onOpenChange={(open) =>
          setFormState((prev) => ({ ...prev, open }))
        }
        onSuccess={announce}
      />

      <CategoryFormDialog
        open={categoryDialogOpen}
        mode="create"
        category={null}
        onOpenChange={setCategoryDialogOpen}
        onSuccess={announce}
      />

      <UpdateStockDialog
        product={stockProduct}
        onOpenChange={(open) => {
          if (!open) setStockProduct(null);
        }}
        onSuccess={announce}
      />

      <DeleteProductDialog
        product={deleteProduct}
        onOpenChange={(open) => {
          if (!open) setDeleteProduct(null);
        }}
        onSuccess={announce}
      />

      <ProductDetailDialog
        product={detailProduct}
        onOpenChange={(open) => {
          if (!open) setDetailProduct(null);
        }}
        onEdit={openEditModal}
        onUpdateStock={(item) => setStockProduct(item)}
      />

      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>
    </div>
  );
}