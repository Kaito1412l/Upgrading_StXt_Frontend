import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import RootLoading from '@/app/loading';
import { ProductDetailPageView } from '@/components/inventory/product-detail-page-view';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  if (!Number.isInteger(id) || id < 1) {
    notFound();
  }

  return (
    <Suspense fallback={<RootLoading />}>
      <ProductDetailPageView id={id} />
    </Suspense>
  );
}