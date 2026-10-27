import { createFileRoute } from '@tanstack/react-router'
import { ForbiddenPage } from '@/features/auth/pages/ForbiddenPage'

export const Route = createFileRoute('/(authed)/forbidden')({
  component: ForbiddenPage,
})
