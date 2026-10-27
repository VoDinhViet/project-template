import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { PageShell } from '@/components/shared/layouts/PageShell'
import { createRole as createRoleApi } from '../api/server-functions/create-role.api'
import { RoleParentCrumb } from '../components/composites/RoleParentCrumb'
import { RoleForm } from '../components/sections/RoleForm'
import { createRoleSchema } from '../schemas/role.schema'

export function CreateRolePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const createRoleFn = useServerFn(createRoleApi)
  const { mutate: createRole, isPending } = useMutation({
    mutationFn: createRoleFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Đã tạo vai trò.')
      await navigate({ to: '/users', search: { tab: 'roles' } })
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <PageShell title="Tạo vai trò" parentCrumbs={<RoleParentCrumb />}>
      <RoleForm
        schema={createRoleSchema}
        defaultValues={{ name: '', description: '', permissions: [] }}
        submitLabel="Tạo vai trò"
        isPending={isPending}
        onSubmit={(value) =>
          createRole({
            data: { ...value, permissions: value.permissions ?? [] },
          })
        }
      />
    </PageShell>
  )
}
