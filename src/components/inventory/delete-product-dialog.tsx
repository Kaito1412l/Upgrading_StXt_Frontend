'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useDeleteProductMutation } from '@/hooks/use-products';
import type { Product } from '@/types/product';

interface DeleteProductDialogProps {
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (message: string) => void;
}

export function DeleteProductDialog({
  product,
  onOpenChange,
  onSuccess,
}: DeleteProductDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteProductMutation();

  const handleConfirmDelete = async () => {
    if (!product) return;
    setErrorMessage(null);

    try {
      await deleteMutation.mutateAsync(product.id);
      onOpenChange(false);
      onSuccess?.(`Product "${product.name}" deleted.`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menghapus barang.',
      );
    }
  };

  return (
    <AlertDialog open={Boolean(product)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            {product
              ? `Apakah Anda yakin ingin menghapus barang "${product.name}"?`
              : 'Apakah Anda yakin ingin menghapus barang ini?'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage ? (
          <AlertDialogBody>
            <p role="alert" className="text-sm text-[#a61e1e]">
              {errorMessage}
            </p>
          </AlertDialogBody>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}