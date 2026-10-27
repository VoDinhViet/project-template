import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRemoveUser } from '../../hooks/use-remove-user'
import type { User } from '../../types/user.type'

type RemoveUserDialogProps = {
  user: User
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function RemoveUserDialog({
  user,
  isOpen,
  onOpenChange,
}: RemoveUserDialogProps) {
  const { mutate: removeUser, isPending } = useRemoveUser()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gỡ khỏi hệ thống</DialogTitle>
          <DialogDescription>
            {user.displayName} ({user.email}) sẽ không còn truy cập được hệ
            thống cho tới khi được mời lại.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              removeUser(
                { userId: user.id },
                { onSuccess: () => onOpenChange(false) },
              )
            }
          >
            Gỡ khỏi hệ thống
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
