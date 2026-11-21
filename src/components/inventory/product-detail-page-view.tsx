'use client';

import { ArrowLeft, Layers, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ProductFormDialog } from '@/components/inventory/product-form-dialog';
import { StockBadge } from '@/components/inventory/stock-badge';
import { UpdateStockDialog } from '@/components/inventory/update-stock-dialog';
import { AppFooter } from '@/components/layout/app-footer';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductDetailQuery } from '@/hooks/use-products';
import type { Product } from '@/types/product';

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

interface ProductDetailPageViewProps {
  id: number;
}

export function ProductDetailPageView({ id }: ProductDetailPageViewProps) {
  const productQuery = useProductDetailQuery(id);
  const product = productQuery.data?.data;

  const [editOpen, setEditOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  if (productQuery.isPending) {
    return (
      <div className="flex min-h-dvh flex-col bg-[var(--apple-canvas)]">
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-2xl space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full rounded-[18px]" />
          </div>
        </main>
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="flex min-h-dvh flex-col bg-[var(--apple-canvas)]">
        <main className="flex-1 p-8 text-center">
          <h2 className="text-xl font-semibold">Barang tidak ditemukan</h2>
          <p className="mt-2 text-sm text-[var(--apple-ink-muted-48)]">
            Barang dengan ID #{id} tidak ada atau telah dihapus.
          </p>
          <Link href="/">
            <Button variant="default" size="sm" className="mt-4">
              Kembali ke Workspace
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--apple-canvas)] text-[var(--apple-ink)]">
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--apple-primary)] hover:underline"
            >
              <ArrowLeft className="size-4" />
              <span>Kembali ke Produk</span>
            </Link>
          </div>

          <div className="rounded-[18px] border border-[var(--apple-hairline)] bg-[var(--apple-canvas)] p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-[var(--apple-primary)]">
                  {product.category?.name ?? `Category #${product.categoryId}`}
                </span>
                <h1 className="mt-1 text-2xl font-bold">{product.name}</h1>
              </div>
              <StockBadge stock={product.stock} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-[var(--apple-divider-soft)] p-4 bg-[var(--apple-canvas-parchment)]">
              <div>
                <p className="text-xs text-[var(--apple-ink-muted-48)]">Harga Satuan</p>
                <p className="text-xl font-semibold">{formatRupiah(product.price)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--apple-ink-muted-48)]">Jumlah Stok</p>
                <p className="text-xl font-semibold">{product.stock} unit</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[var(--apple-ink-muted-80)]">Deskripsi Produk</h3>
              <p className="mt-1 text-sm text-[var(--apple-ink)] leading-relaxed">
                {product.description || 'Tidak ada deskripsi tersedia untuk barang ini.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--apple-divider-soft)] pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStockProduct(product)}
              >
                <Layers className="size-4" />
                <span>Update Stock</span>
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-4" />
                <span>Edit Product</span>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
      <AppHeader />

      <ProductFormDialog
        open={editOpen}
        mode="edit"
        product={product}
        onOpenChange={setEditOpen}
      />

      <UpdateStockDialog
        product={stockProduct}
        onOpenChange={(open) => {
          if (!open) setStockProduct(null);
        }}
      />
    </div>
  );
}