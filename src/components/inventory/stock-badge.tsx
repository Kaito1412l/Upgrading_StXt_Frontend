import { Badge, type badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export type StockStatusLevel = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export function getStockStatusLevel(stock: number): StockStatusLevel {
  if (stock <= 0) return 'OUT_OF_STOCK';
  if (stock <= 5) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export const STOCK_STATUS_META: Record<
  StockStatusLevel,
  {
    label: string;
    badgeVariant: VariantProps<typeof badgeVariants>['variant'];
    className?: string;
  }
> = {
  IN_STOCK: {
    label: 'In Stock',
    badgeVariant: 'active',
    className: 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700',
  },
  LOW_STOCK: {
    label: 'Low Stock',
    badgeVariant: 'subtle',
    className: 'border-amber-600/30 bg-amber-500/12 text-amber-800',
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    badgeVariant: 'overdue',
  },
};

interface StockBadgeProps {
  stock: number;
  className?: string;
}

export function StockBadge({ stock, className }: StockBadgeProps) {
  const level = getStockStatusLevel(stock);
  const meta = STOCK_STATUS_META[level];

  return (
    <Badge
      variant={meta.badgeVariant}
      className={cn(meta.className, className)}
    >
      {meta.label} ({stock})
    </Badge>
  );
}