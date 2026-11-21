'use client';

import { FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CategoryFormDialog } from '@/components/inventory/category-form-dialog';
import { DeleteCategoryDialog } from '@/components/inventory/delete-category-dialog';
import { AppFooter } from '@/components/layout/app-footer';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCategoriesQuery } from '@/hooks/use-categories';
import type { Category } from '@/types/category';

export function CategoryWorkspace() {
  const categoriesQuery = useCategoriesQuery({ page: 1, limit: 100 });
  const categories = categoriesQuery.data?.data ?? [];

  const [formState, setFormState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    category: Category | null;
  }>({ open: false, mode: 'create', category: null });

  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const handleSuccess = (msg: string) => {
    setAnnouncement(msg);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--apple-canvas)] text-[var(--apple-ink)]">
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-[1440px] space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[32px] font-semibold tracking-[-0.015em] text-[var(--apple-ink)]">
                Categories
              </h1>
              <p className="mt-1 text-[17px] text-[var(--apple-ink-muted-80)]">
                Kelola kategori barang untuk pengelompokan inventaris.
              </p>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() =>
                setFormState({ open: true, mode: 'create', category: null })
              }
            >
              <Plus aria-hidden="true" className="size-4" />
              <span>New Category</span>
            </Button>
          </div>

          {categoriesQuery.isPending ? (
            <div className="space-y-3 rounded-[18px] border border-[var(--apple-hairline)] bg-[var(--apple-canvas)] p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-[11px]" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[18px] border border-[var(--apple-hairline)] bg-[var(--apple-canvas)] px-6 py-16 text-center">
              <FolderKanban className="size-10 text-[var(--apple-ink-muted-48)]" />
              <h3 className="mt-3 text-[21px] font-semibold text-[var(--apple-ink)]">
                Belum Ada Kategori
              </h3>
              <p className="mt-1 text-[15px] text-[var(--apple-ink-muted-48)]">
                Tambahkan kategori pertama kamu untuk mulai mengelompokkan barang.
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="mt-5"
                onClick={() =>
                  setFormState({ open: true, mode: 'create', category: null })
                }
              >
                <Plus aria-hidden="true" className="size-4" />
                <span>Create Category</span>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[18px] border border-[var(--apple-hairline)] bg-[var(--apple-canvas)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-mono text-xs text-[var(--apple-ink-muted-48)]">
                        #{cat.id}
                      </TableCell>
                      <TableCell className="font-semibold text-[var(--apple-ink)]">
                        {cat.name}
                      </TableCell>
                      <TableCell className="text-sm text-[var(--apple-ink-muted-80)]">
                        {cat.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setFormState({
                                open: true,
                                mode: 'edit',
                                category: cat,
                              })
                            }
                          >
                            <Pencil aria-hidden="true" className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteCategory(cat)}
                          >
                            <Trash2
                              aria-hidden="true"
                              className="size-4 text-[#a61e1e]"
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      <AppFooter />
      <AppHeader
        onNewCategory={() =>
          setFormState({ open: true, mode: 'create', category: null })
        }
        onSync={() => void categoriesQuery.refetch()}
        isSyncing={categoriesQuery.isFetching}
      />

      <CategoryFormDialog
        open={formState.open}
        mode={formState.mode}
        category={formState.category}
        onOpenChange={(open) =>
          setFormState((prev) => ({ ...prev, open }))
        }
        onSuccess={handleSuccess}
      />

      <DeleteCategoryDialog
        category={deleteCategory}
        onOpenChange={(open) => {
          if (!open) setDeleteCategory(null);
        }}
        onSuccess={handleSuccess}
      />

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}