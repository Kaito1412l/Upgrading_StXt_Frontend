'use client';

import { BarChart3, Package, Layers, FolderKanban } from 'lucide-react';
import { AppFooter } from '@/components/layout/app-footer';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoriesQuery } from '@/hooks/use-categories';
import { useInventorySummaryQuery, useProductsQuery } from '@/hooks/use-products';

export function InventoryAnalyticsView() {
  const summaryQuery = useInventorySummaryQuery();
  const categoriesQuery = useCategoriesQuery({ page: 1, limit: 100 });
  const productsQuery = useProductsQuery({ page: 1, limit: 100 });

  const summary = summaryQuery.data?.data;
  const categories = categoriesQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];

  const outOfStockItems = products.filter((p) => p.stock <= 0);
  const lowStockItems = products.filter((p) => p.stock > 0 && p.stock <= 5);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--apple-canvas)] text-[var(--apple-ink)]">
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-[1440px] space-y-8">
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.015em] text-[var(--apple-ink)]">
              Inventory Summary & Analytics
            </h1>
            <p className="mt-1 text-[17px] text-[var(--apple-ink-muted-80)]">
              Ringkasan statistik stok barang dan pengelompokan kategori.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="rounded-[18px] border-[var(--apple-hairline)] bg-[var(--apple-canvas)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--apple-ink-muted-80)]">
                  Total Jenis Barang
                </CardTitle>
                <Package className="size-4 text-[var(--apple-primary)]" />
              </CardHeader>
              <CardContent>
                {summaryQuery.isPending ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold">{summary?.totalProductTypes ?? 0}</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[18px] border-[var(--apple-hairline)] bg-[var(--apple-canvas)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--apple-ink-muted-80)]">
                  Total Akumulasi Stok
                </CardTitle>
                <Layers className="size-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                {summaryQuery.isPending ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold">{summary?.totalStock ?? 0}</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[18px] border-[var(--apple-hairline)] bg-[var(--apple-canvas)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[var(--apple-ink-muted-80)]">
                  Total Kategori
                </CardTitle>
                <FolderKanban className="size-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                {categoriesQuery.isPending ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold">{categories.length}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="rounded-[18px] border-[var(--apple-hairline)] bg-[var(--apple-canvas)]">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#a61e1e]">
                  Out of Stock ({outOfStockItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {outOfStockItems.length === 0 ? (
                  <p className="text-sm text-[var(--apple-ink-muted-48)]">
                    Tidak ada barang yang habis.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {outOfStockItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-[var(--apple-ink-muted-48)]">
                          Stok: 0
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[18px] border-[var(--apple-hairline)] bg-[var(--apple-canvas)]">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-amber-700">
                  Low Stock (&le; 5 unit) ({lowStockItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <p className="text-sm text-[var(--apple-ink-muted-48)]">
                    Tidak ada barang yang stoknya menipis.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {lowStockItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs font-semibold text-amber-700">
                          Stok: {item.stock}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AppFooter />
      <AppHeader
        onSync={() => {
          void summaryQuery.refetch();
          void categoriesQuery.refetch();
          void productsQuery.refetch();
        }}
        isSyncing={summaryQuery.isFetching}
      />
    </div>
  );
}