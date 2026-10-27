import { useSuspenseQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { PageShell } from '@/components/shared/layouts/PageShell'
import { Button } from '@/components/ui/button'
import { healthQueryOptions } from '../api'
import {
  HEALTH_POLL_INTERVAL_MS,
  databaseStatusLabels,
} from '../constants/health.constant'

export function HealthPage() {
  const {
    data: health,
    refetch: refetchHealth,
    isFetching,
    isRefetchError,
  } = useSuspenseQuery({
    ...healthQueryOptions(),
    refetchInterval: HEALTH_POLL_INTERVAL_MS,
  })

  return (
    <PageShell title="Trạng thái hệ thống" bodyClassName="max-w-xl">
      <section className="flex items-center justify-between gap-4 rounded-lg border p-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Cơ sở dữ liệu</span>
          <Badge variant={health.db === 'UP' ? 'secondary' : 'destructive'}>
            {databaseStatusLabels[health.db]}
          </Badge>
          {isRefetchError && (
            <span role="alert" className="text-xs text-destructive">
              Không cập nhật được trạng thái mới nhất.
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isFetching}
          onClick={() => void refetchHealth()}
        >
          Kiểm tra lại
        </Button>
      </section>
    </PageShell>
  )
}
