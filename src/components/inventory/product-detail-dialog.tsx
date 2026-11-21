'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StockBadge } from '@/components/inventory/stock-badge';
import type { Product } from '@/types/product';

interface ProductDetailDialogProps {
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onEdit?: (product: Product) => void;
  onUpdateStock?: (product: Product) => void;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductDetailDialog({
  product,
  onOpenChange,
  onEdit,
  onUpdateStock,
}: ProductDetailDialogProps) {
  return (
    <Dialog open={Boolean(product)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product?.name ?? 'Product Detail'}</DialogTitle>
          <DialogDescription>
            {product?.category?.name
              ? `Kategori: ${product.category.name}`
              : `Category ID: ${product?.categoryId ?? '-'}`}
          </DialogDescription>
        </DialogHeader>

        {product ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/10 p-3.5">
              <div>
                <p className="text-xs text-neutral-500">Harga Satuan</p>
                <p className="text-lg font-semibold">
                  {formatRupiah(Number(product.price))}
                </p>
              </div>
              <StockBadge stock={product.stock} />
            </div>

            <div>
              <p className="text-xs font-medium text-neutral-500">Deskripsi</p>
              <p className="mt-1 text-sm text-neutral-700">
                {product.description || 'Tidak ada deskripsi.'}
              </p>
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex-wrap gap-2">
          {product ? (
            <>
              <Link href={`/products/${product.id}`}>
                <Button type="button" variant="outline" size="sm">
                  Full Page
                </Button>
              </Link>
              {onUpdateStock ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const target = product;
                    onOpenChange(false);
                    onUpdateStock(target);
                  }}
                >
                  Update Stock
                </Button>
              ) : null}
              {onEdit ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const target = product;
                    onOpenChange(false);
                    onEdit(target);
                  }}
                >
                  Edit
                </Button>
              ) : null}
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}