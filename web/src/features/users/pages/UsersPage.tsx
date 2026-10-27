import { PermissionGate } from '@/components/shared/composites/PermissionGate'
import { PageShell } from '@/components/shared/layouts/PageShell'
import { useHasPermission } from '@/hooks/use-has-permission'
import { CreateInvitationsDialog } from '../components/composites/CreateInvitationsDialog'
import { RoleBreakdown } from '../components/sections/RoleBreakdown'
import { UserStatCards } from '../components/sections/UserStatCards'
import { UsersTabs } from '../components/sections/UsersTabs'

export function UsersPage() {
  const canInvite = useHasPermission('users:invite')
  // Mời phải chọn vai trò, mà danh sách vai trò cần `roles:read`.
  const canReadRoles = useHasPermission('roles:read')

  return (
    <PageShell
      title="Người dùng"
      actions={canInvite && canReadRoles && <CreateInvitationsDialog />}
    >
      <UserStatCards canInvite={canInvite} />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <UsersTabs />
        <PermissionGate permission="roles:read">
          <RoleBreakdown />
        </PermissionGate>
      </div>
    </PageShell>
  )
}
