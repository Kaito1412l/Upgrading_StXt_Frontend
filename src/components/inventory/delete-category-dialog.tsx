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
import { useDeleteCategoryMutation } from '@/hooks/use-categories';
import type { Category } from '@/types/category';

interface DeleteCategoryDialogProps {
  category: Category | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (message: string) => void;
}

export function DeleteCategoryDialog({
  category,
  onOpenChange,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteCategoryMutation();

  const handleConfirmDelete = async () => {
    if (!category) return;
    setErrorMessage(null);

    try {
      await deleteMutation.mutateAsync(category.id);
      onOpenChange(false);
      onSuccess?.(`Category "${category.name}" deleted.`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menghapus kategori.',
      );
    }
  };

  return (
    <AlertDialog open={Boolean(category)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>
            {category
              ? `Apakah Anda yakin ingin menghapus kategori "${category.name}"?`
              : 'Apakah Anda yakin ingin menghapus kategori ini?'}
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