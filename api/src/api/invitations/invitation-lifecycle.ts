import type { InvitationSelect } from '../../database/schemas/index.js';
import {
  INVITATION_TTL_DAYS,
  InvitationStatus,
  MS_PER_DAY,
} from './invitations.constant.js';

export function resolveInvitationStatus(
  invitation: Pick<InvitationSelect, 'acceptedAt' | 'revokedAt' | 'expiresAt'>,
  now: Date,
): InvitationStatus {
  // Thứ tự các `case` là thứ tự ưu tiên: thu hồi thắng đã dùng, đã dùng thắng hết hạn.
  switch (true) {
    case Boolean(invitation.revokedAt):
      return InvitationStatus.REVOKED;
    case Boolean(invitation.acceptedAt):
      return InvitationStatus.ACCEPTED;
    case invitation.expiresAt <= now:
      return InvitationStatus.EXPIRED;
    default:
      return InvitationStatus.PENDING;
  }
}

export function buildExpiresAt(): Date {
  return new Date(Date.now() + INVITATION_TTL_DAYS * MS_PER_DAY);
}
