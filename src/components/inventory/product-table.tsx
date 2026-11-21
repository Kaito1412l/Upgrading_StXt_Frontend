'use client';

import { ArrowUpRight, Layers, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { StockBadge } from '@/components/inventory/stock-badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePrefetchProductDetail } from '@/hooks/use-products';
import type { Product } from '@/types/product';

interface ProductTableProps {
  products: Product[];
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

export function ProductTable({
  products,
  onView,
  onUpdateStock,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const prefetchDetail = usePrefetchProductDetail();

  return (
    <div className="overflow-x-auto rounded-[18px] border border-[var(--apple-hairline)] bg-[var(--apple-canvas)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              onMouseEnter={() => prefetchDetail(product.id)}
              onFocus={() => prefetchDetail(product.id)}
            >
              <TableCell className="max-w-xs">
                <div className="font-semibold text-[var(--apple-ink)]">
                  <button
                    type="button"
                    onClick={() => onView(product)}
                    className="cursor-pointer text-left hover:text-[var(--apple-primary)] hover:underline"
                  >
                    {product.name}
                  </button>
                </div>
                {product.description ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-[var(--apple-ink-muted-48)]">
                    {product.description}
                  </p>
                ) : null}
              </TableCell>
              <TableCell className="text-sm text-[var(--apple-ink-muted-80)]">
                {product.category?.name ?? `Category #${product.categoryId}`}
              </TableCell>
              <TableCell className="font-medium text-[var(--apple-ink)] tabular-nums">
                {formatRupiah(product.price)}
              </TableCell>
              <TableCell>
                <StockBadge stock={product.stock} />
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                  <Link
                    href={`/products/${product.id}`}
                    aria-label={`Open detail page for ${product.name}`}
                    className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-[var(--apple-ink-muted-80)] hover:bg-[var(--apple-canvas-parchment)] hover:text-[var(--apple-ink)]"
                  >
                    <span>Detail</span>
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </Link>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}