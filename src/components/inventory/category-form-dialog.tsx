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
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from '@/hooks/use-categories';
import type { Category } from '@/types/category';

interface CategoryFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  category: Category | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (message: string) => void;
}

export function CategoryFormDialog({
  open,
  mode,
  category,
  onOpenChange,
  onSuccess,
}: CategoryFormDialogProps) {
  const nameId = useId();
  const descriptionId = useId();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setErrorMessage(null);

    if (mode === 'edit' && category) {
      setName(category.name);
      setDescription(category.description ?? '');
    } else {
      setName('');
      setDescription('');
    }
  }, [open, mode, category]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Nama kategori wajib diisi.');
      return;
    }

    const normalizedDescription = description.trim() ? description.trim() : null;

    try {
      if (mode === 'edit' && category) {
        await updateMutation.mutateAsync({
          id: category.id,
          payload: {
            name: trimmedName,
            description: normalizedDescription,
          },
        });
        onOpenChange(false);
        onSuccess?.(`Category "${trimmedName}" updated.`);
      } else {
        await createMutation.mutateAsync({
          name: trimmedName,
          description: normalizedDescription,
        });
        onOpenChange(false);
        onSuccess?.(`Category "${trimmedName}" created.`);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan kategori.',
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Category' : 'New Category'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Perbarui nama atau deskripsi kategori barang.'
              : 'Tambahkan kategori baru untuk mengelompokkan barang.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage ? (
            <div
              role="alert"
              className="rounded-xl border border-[#c92a2a]/30 bg-[#c92a2a]/10 px-3.5 py-2.5 text-sm text-[#a61e1e]"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor={nameId}>Category Name</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Elektronik"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={descriptionId}>Description</Label>
            <Textarea
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat kategori (opsional)"
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
                  : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}