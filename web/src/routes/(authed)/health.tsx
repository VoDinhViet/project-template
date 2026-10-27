import { createFileRoute } from '@tanstack/react-router'
import { PagePending } from '@/components/shared/primitives/PagePending'
import { healthQueryOptions } from '@/features/health/api'
import { HealthPage } from '@/features/health/pages/HealthPage'

export const Route = createFileRoute('/(authed)/health')({
  loader: async ({ context }) => {
    await context.queryClient.query({
      ...healthQueryOptions(),
      staleTime: 'static',
    })
  },
  pendingComponent: PagePending,
  component: HealthPage,
})
