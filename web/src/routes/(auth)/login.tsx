import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { currentUserQueryOptions } from '@/features/auth/api'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { resolveInternalRedirect } from '@/lib/resolve-internal-redirect'

const loginSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/(auth)/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const currentUser = await context.queryClient.query(
      currentUserQueryOptions(),
    )
    if (currentUser) {
      throw redirect({ href: resolveInternalRedirect(search.redirect) })
    }
  },
  component: LoginPage,
})
