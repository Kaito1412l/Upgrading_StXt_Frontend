import { Suspense } from 'react';
import RootLoading from '@/app/loading';
import { InventoryAnalyticsView } from '@/components/inventory/inventory-analytics-view';

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<RootLoading />}>
      <InventoryAnalyticsView />
    </Suspense>
  );
}