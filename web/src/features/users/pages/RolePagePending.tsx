import { PageShell } from '@/components/shared/layouts/PageShell'
import { RoleParentCrumb } from '../components/composites/RoleParentCrumb'
import { RoleFormSkeleton } from '../components/sections/RoleFormSkeleton'

type RolePagePendingProps = {
  title: string
}

export function RolePagePending({ title }: RolePagePendingProps) {
  return (
    <PageShell title={title} parentCrumbs={<RoleParentCrumb />}>
      <RoleFormSkeleton />
    </PageShell>
  )
}
