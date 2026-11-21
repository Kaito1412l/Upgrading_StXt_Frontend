'use client';

import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateProductStockMutation } from '@/hooks/use-products';
import type { Product } from '@/types/product';

interface UpdateStockDialogProps {
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (message: string) => void;
}

export function UpdateStockDialog({
  product,
  onOpenChange,
  onSuccess,
}: UpdateStockDialogProps) {
  const stockInputId = useId();
  const [stockValue, setStockValue] = useState('0');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateStockMutation = useUpdateProductStockMutation();

  useEffect(() => {
    if (product) {
      setStockValue(String(product.stock));
      setErrorMessage(null);
    }
  }, [product]);

  const adjustStock = (delta: number) => {
    const current = Number(stockValue);
    const base = Number.isFinite(current) ? Math.floor(current) : 0;
    const next = Math.max(0, base + delta);
    setStockValue(String(next));
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product) return;

    const parsed = Number(stockValue);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setErrorMessage('Jumlah stok tidak boleh negatif.');
      return;
    }

    try {
      await updateStockMutation.mutateAsync({
        id: product.id,
        stock: parsed,
      });
      onOpenChange(false);
      onSuccess?.(`Stock for "${product.name}" updated to ${parsed}.`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal memperbarui stok.',
      );
    }
  };

  return (
    <Dialog open={Boolean(product)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Stock</DialogTitle>
          <DialogDescription>
            {product
              ? `Atur jumlah stok untuk "${product.name}" (tidak boleh kurang dari 0).`
              : 'Atur jumlah stok barang.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor={stockInputId}>New Stock Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustStock(-1)}
                disabled={updateStockMutation.isPending}
              >
                -1
              </Button>
              <Input
                id={stockInputId}
                type="number"
                min={0}
                step={1}
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adjustStock(1)}
                disabled={updateStockMutation.isPending}
              >
                +1
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateStockMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateStockMutation.isPending}>
              {updateStockMutation.isPending ? 'Updating...' : 'Save Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}