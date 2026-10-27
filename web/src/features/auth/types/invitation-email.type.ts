export type InvitationEmailStatus =
  'PENDING' | 'EXPIRED' | 'REVOKED' | 'ACCEPTED'

export type InvitationEmail = {
  email: string | null
  status: InvitationEmailStatus
}
