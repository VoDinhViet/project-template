import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useRouteContext } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { PageShell } from '@/components/shared/layouts/PageShell'
import { rolesQueryOptions } from '../api'
import { updateRole as updateRoleApi } from '../api/server-functions/update-role.api'
import { RoleParentCrumb } from '../components/composites/RoleParentCrumb'
import { RoleForm } from '../components/sections/RoleForm'
import { RoleFormSkeleton } from '../components/sections/RoleFormSkeleton'
import { useRefreshUserAccess } from '../hooks/use-refresh-user-access'
import { updateRoleSchema } from '../schemas/role.schema'
import { canGrantRole } from '../utils/grant'

// Form không giữ `roleId`; trang ghép lại khi gọi `api`.
const roleFormSchema = updateRoleSchema.omit({ roleId: true })

export function UpdateRolePage() {
  const { roleId } = useParams({ from: '/(authed)/roles/$roleId' })
  const { currentUser } = useRouteContext({ from: '/(authed)' })
  const navigate = useNavigate()
  const refreshUserAccess = useRefreshUserAccess()
  const { data: roles, error: rolesError } = useQuery(rolesQueryOptions())
  const updateRoleFn = useServerFn(updateRoleApi)
  const { mutate: updateRole, isPending } = useMutation({
    mutationFn: updateRoleFn,
    // Sửa quyền của vai trò mình đang giữ thì quyền trên trang cũng đổi.
    onSuccess: async () => {
      await refreshUserAccess()
      toast.success('Đã lưu vai trò.')
      await navigate({ to: '/users', search: { tab: 'roles' } })
    },
    onError: (error) => toast.error(error.message),
  })

  const role = roles?.find((candidate) => candidate.id === roleId)
  // Khớp `updateRole` của `api`: phải trao được vai trò, nên vai trò hệ thống không sửa được.
  const isGrantable = role !== undefined && canGrantRole(currentUser, role)

  return (
    <PageShell
      title={role?.name ?? 'Sửa vai trò'}
      parentCrumbs={<RoleParentCrumb />}
    >
      {rolesError && (
        <p role="alert" className="text-sm text-destructive">
          {rolesError.message}
        </p>
      )}
      {!roles && !rolesError && <RoleFormSkeleton />}
      {roles && !role && (
        <p className="text-sm text-muted-foreground">Không tìm thấy vai trò.</p>
      )}
      {role && !isGrantable && (
        <p className="text-sm text-muted-foreground">
          Bạn không sửa được vai trò này: vai trò hệ thống hoặc có quyền bạn
          chưa có.
        </p>
      )}
      {role && isGrantable && (
        <RoleForm
          schema={roleFormSchema}
          defaultValues={{
            name: role.name,
            description: role.description ?? '',
            permissions: role.permissions,
            isDefault: role.isDefault,
          }}
          submitLabel="Lưu"
          isPending={isPending}
          onSubmit={(value) => updateRole({ data: { roleId, ...value } })}
        />
      )}
    </PageShell>
  )
}
