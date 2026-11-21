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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCategoriesQuery } from '@/hooks/use-categories';
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from '@/hooks/use-products';
import type { Product } from '@/types/product';

interface ProductFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (message: string) => void;
}

export function ProductFormDialog({
  open,
  mode,
  product,
  onOpenChange,
  onSuccess,
}: ProductFormDialogProps) {
  const nameId = useId();
  const categoryIdField = useId();
  const priceId = useId();
  const stockId = useId();
  const descriptionId = useId();

  const [name, setName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [price, setPrice] = useState('0');
  const [stock, setStock] = useState('0');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categoriesQuery = useCategoriesQuery({ page: 1, limit: 100 });
  const categories = categoriesQuery.data?.data ?? [];

  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setErrorMessage(null);

    if (mode === 'edit' && product) {
      setName(product.name);
      setSelectedCategoryId(String(product.categoryId));
      setPrice(String(product.price));
      setStock(String(product.stock));
      setDescription(product.description ?? '');
    } else {
      setName('');
      setSelectedCategoryId(categories[0] ? String(categories[0].id) : '');
      setPrice('0');
      setStock('0');
      setDescription('');
    }
  }, [open, mode, product, categories]);

  const categorySelectItems = Object.fromEntries(
    categories.map((cat) => [String(cat.id), cat.name]),
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Nama barang wajib diisi.');
      return;
    }

    const parsedCategoryId = Number(selectedCategoryId);
    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId < 1) {
      setErrorMessage('Pilih kategori barang terlebih dahulu.');
      return;
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setErrorMessage('Harga barang tidak boleh negatif.');
      return;
    }

    const parsedStock = Number(stock);
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setErrorMessage('Jumlah stok harus berupa bilangan bulat >= 0.');
      return;
    }

    const normalizedDescription = description.trim() ? description.trim() : null;

    try {
      if (mode === 'edit' && product) {
        await updateMutation.mutateAsync({
          id: product.id,
          payload: {
            name: trimmedName,
            categoryId: parsedCategoryId,
            price: parsedPrice,
            stock: parsedStock,
            description: normalizedDescription,
          },
        });
        onOpenChange(false);
        onSuccess?.(`Product "${trimmedName}" updated.`);
      } else {
        await createMutation.mutateAsync({
          name: trimmedName,
          categoryId: parsedCategoryId,
          price: parsedPrice,
          stock: parsedStock,
          description: normalizedDescription,
        });
        onOpenChange(false);
        onSuccess?.(`Product "${trimmedName}" created.`);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan data barang.',
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Product' : 'New Product'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Perbarui informasi barang, kategori, harga, atau stok.'
              : 'Tambahkan barang baru ke dalam inventaris.'}
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
            <Label htmlFor={nameId}>Product Name</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Keyboard Mechanical"
              maxLength={150}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={categoryIdField}>Category</Label>
            <Select
              id={categoryIdField}
              value={selectedCategoryId}
              items={categorySelectItems}
              onValueChange={(val) => {
                if (val) setSelectedCategoryId(val);
              }}
            >
              <SelectTrigger id={categoryIdField}>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categories.length === 0 && !categoriesQuery.isPending ? (
              <p className="text-xs text-amber-700">
                Belum ada kategori. Buat kategori terlebih dahulu di menu
                Categories.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={priceId}>Price (Rp)</Label>
              <Input
                id={priceId}
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={stockId}>Stock</Label>
              <Input
                id={stockId}
                type="number"
                min={0}
                step={1}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={descriptionId}>Description</Label>
            <Textarea
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan spesifikasi atau lokasi barang (opsional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : mode === 'edit'
                  ? 'Save Changes'
                  : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}