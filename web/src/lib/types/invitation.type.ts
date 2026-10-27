// Khớp `InvitationResultResDto` của `api`.
export type InvitationResultStatus = 'INVITED' | 'ALREADY_HAS_ACCESS'

export type InvitationEmailStatus =
  'SENT' | 'QUEUED' | 'FAILED' | 'NOT_REQUESTED' | 'DISABLED'

export type InvitationResult = {
  email: string
  status: InvitationResultStatus
  token: string | null
  emailStatus: InvitationEmailStatus
}
