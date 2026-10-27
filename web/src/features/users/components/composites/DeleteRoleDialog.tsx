import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Role } from '@/lib/types/role.type'
import { deleteRole } from '../../api/server-functions/delete-role.api'
import type { RoleIdSchema } from '../../schemas/role.schema'

type DeleteRoleDialogProps = {
  role: Role
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function DeleteRoleDialog({
  role,
  isOpen,
  onOpenChange,
}: DeleteRoleDialogProps) {
  const queryClient = useQueryClient()
  const deleteRoleFn = useServerFn(deleteRole)
  const deleteRoleMutation = useMutation({
    mutationFn: (value: RoleIdSchema) => deleteRoleFn({ data: value }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Đã xoá vai trò.')
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xoá vai trò</DialogTitle>
          <DialogDescription>
            Xoá vai trò {role.name}. Vai trò còn lời mời đang chờ thì phải thu
            hồi lời mời trước.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteRoleMutation.isPending}
            onClick={() => deleteRoleMutation.mutate({ roleId: role.id })}
          >
            Xoá vai trò
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
