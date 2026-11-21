'use client';

import { ArrowUpRight, Layers, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { StockBadge } from '@/components/inventory/stock-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePrefetchProductDetail } from '@/hooks/use-products';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  onView: (product: Product) => void;
  onUpdateStock: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function ProductCard({
  product,
  onView,
  onUpdateStock,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const prefetchDetail = usePrefetchProductDetail();

  return (
    <Card
      onMouseEnter={() => prefetchDetail(product.id)}
      onFocus={() => prefetchDetail(product.id)}
      className="flex h-full flex-col justify-between rounded-[18px] border border-[var(--apple-hairline)] bg-[var(--apple-canvas)]"
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="subtle">
            {product.category?.name ?? `Category #${product.categoryId}`}
          </Badge>
          <StockBadge stock={product.stock} />
        </div>
        <CardTitle className="text-[18px] leading-snug font-semibold">
          <button
            type="button"
            onClick={() => onView(product)}
            className="cursor-pointer text-left hover:text-[var(--apple-primary)] hover:underline"
          >
            {product.name}
          </button>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {product.description || 'Tidak ada deskripsi barang.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-[20px] font-semibold text-[var(--apple-ink)] tabular-nums">
          {formatRupiah(product.price)}
        </p>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--apple-divider-soft)] pt-4">
        <Link
          href={`/products/${product.id}`}
          className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-medium text-[var(--apple-primary)] hover:underline"
        >
          <span>Detail</span>
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onUpdateStock(product)}
          >
            <Layers aria-hidden="true" className="size-3.5" />
            <span>Stock</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Edit ${product.name}`}
            onClick={() => onEdit(product)}
          >
            <Pencil aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete ${product.name}`}
            onClick={() => onDelete(product)}
          >
            <Trash2 aria-hidden="true" className="size-4 text-[#a61e1e]" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}