import { createFileRoute } from '@tanstack/react-router'
import { AuthLayoutPage } from '@/features/auth/pages/AuthLayoutPage'

export const Route = createFileRoute('/(auth)')({
  component: AuthLayoutPage,
})
