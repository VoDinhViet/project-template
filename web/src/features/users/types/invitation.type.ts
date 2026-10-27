import type { RoleRef } from '@/lib/types/role.type'

export type InvitationStatus = 'PENDING' | 'EXPIRED' | 'REVOKED' | 'ACCEPTED'

export type PendingInvitation = {
  id: string
  email: string
  role: RoleRef
  invitedByName: string | null
  expiresAt: string
  createdAt: string
}

export type InvitationSuggestion = {
  email: string
  status: Extract<InvitationStatus, 'EXPIRED' | 'REVOKED'>
  invitedAt: string
}

export type InvitationToken = {
  token: string
}

export type Invitation = {
  email: string
  role: RoleRef
  invitedByName: string | null
  expiresAt: string
  status: InvitationStatus
  isEmailMatched: boolean
  hasAccess: boolean
}
