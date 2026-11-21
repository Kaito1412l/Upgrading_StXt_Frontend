import { Suspense } from 'react';
import RootLoading from '@/app/loading';
import { CategoryWorkspace } from '@/components/inventory/category-workspace';

export default function CategoriesPage() {
  return (
    <Suspense fallback={<RootLoading />}>
      <CategoryWorkspace />
    </Suspense>
  );
}