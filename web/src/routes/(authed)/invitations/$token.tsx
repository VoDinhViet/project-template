import { createFileRoute } from '@tanstack/react-router'
import { PagePending } from '@/components/shared/primitives/PagePending'
import { invitationQueryOptions } from '@/features/users/api'
import { InvitationAcceptPage } from '@/features/users/pages/InvitationAcceptPage'

export const Route = createFileRoute('/(authed)/invitations/$token')({
  // Nuốt lỗi để trang tự hiện "link không hợp lệ" thay vì màn lỗi chung của `(authed)`.
  loader: async ({ context, params }) => {
    await context.queryClient
      .query(invitationQueryOptions(params.token))
      .catch(() => undefined)
  },
  pendingComponent: PagePending,
  component: InvitationAcceptPage,
})
