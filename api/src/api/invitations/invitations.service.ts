import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  inArray,
  gt,
  isNotNull,
  isNull,
  like,
  lte,
  notExists,
  or,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { OffsetPaginatedDto } from '../../common/dto/offset-pagination/offset-pagination.dto.js';
import { escapeLike } from '../../common/utils/escape-like.js';
import { Order } from '../../constants/app.constant.js';
import { ErrorCode } from '../../constants/error-code.constant.js';
import { DRIZZLE } from '../../database/database.module.js';
import type { Database, DbTransaction } from '../../database/database.type.js';
import {
  invitations,
  roles,
  users,
  type InvitationSelect,
} from '../../database/schemas/index.js';
import type { AllConfigType } from '../../config/config.type.js';
import { AppException } from '../../exceptions/app.exception.js';
import type { CurrentUser } from '../../decorators/current-user.decorator.js';
import { EmailOutboxService } from '../mail/email-outbox.service.js';
import { MailDeliveryStatus } from '../mail/mail.constant.js';
import {
  buildInvitationEmail,
  type InvitationEmailInput,
} from '../mail/templates/invitation-email.js';
import { ensureCanGrantRole } from '../roles/grant.js';
import { CreateInvitationsReqDto } from './dto/create-invitations.req.dto.js';
import { GetInvitationSuggestionsReqDto } from './dto/get-invitation-suggestions.req.dto.js';
import { GetInvitationsReqDto } from './dto/get-invitations.req.dto.js';
import { InvitationEmailResDto } from './dto/invitation-email.res.dto.js';
import { InvitationSuggestionResDto } from './dto/invitation-suggestion.res.dto.js';
import { InvitationResultResDto } from './dto/invitation-result.res.dto.js';
import { InvitationTokenResDto } from './dto/invitation-token.res.dto.js';
import {
  InvitationResDto,
  PageInvitationResDto,
} from './dto/invitation.res.dto.js';
import { generateInvitationToken, hashInvitationToken } from './token.js';
import {
  INVITATION_TTL_DAYS,
  InvitationEmailStatus,
  InvitationResultStatus,
  MAX_INVITATION_SUGGESTIONS,
  InvitationStatus,
} from './invitations.constant.js';
import {
  buildExpiresAt,
  resolveInvitationStatus,
} from './invitation-lifecycle.js';

type InvitationEmailContent = Omit<InvitationEmailInput, 'link' | 'ttlDays'>;

const invitationEmailStatusByDelivery: Record<
  MailDeliveryStatus,
  InvitationEmailStatus
> = {
  [MailDeliveryStatus.SENT]: InvitationEmailStatus.SENT,
  [MailDeliveryStatus.QUEUED]: InvitationEmailStatus.QUEUED,
  [MailDeliveryStatus.FAILED]: InvitationEmailStatus.FAILED,
  [MailDeliveryStatus.DISABLED]: InvitationEmailStatus.DISABLED,
};

// Trạng thái không còn dùng được của lời mời, ánh xạ sang lỗi khi chấp nhận.
const acceptErrorByStatus: Partial<Record<InvitationStatus, ErrorCode>> = {
  [InvitationStatus.EXPIRED]: ErrorCode.E017,
  [InvitationStatus.REVOKED]: ErrorCode.E018,
  [InvitationStatus.ACCEPTED]: ErrorCode.E019,
};

@Injectable()
export class InvitationsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly emailOutboxService: EmailOutboxService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async getInvitations(
    reqDto: GetInvitationsReqDto,
  ): Promise<OffsetPaginatedDto<PageInvitationResDto>> {
    const filter = and(
      isNull(invitations.acceptedAt),
      isNull(invitations.revokedAt),
      reqDto.q
        ? like(invitations.email, `%${escapeLike(reqDto.q)}%`)
        : undefined,
    );
    // Sắp theo hạn để lời mời sắp hết hạn nổi lên đầu; `id` làm khoá phụ cho phân trang ổn định.
    const sortOrder = reqDto.order === Order.DESC ? desc : asc;

    const [entities, totalRecords] = await Promise.all([
      this.db
        .select({
          id: invitations.id,
          email: invitations.email,
          role: getTableColumns(roles),
          invitedByName: users.displayName,
          expiresAt: invitations.expiresAt,
          createdAt: invitations.createdAt,
        })
        .from(invitations)
        .innerJoin(roles, eq(roles.id, invitations.roleId))
        .leftJoin(users, eq(users.id, invitations.invitedBy))
        .where(filter)
        .orderBy(sortOrder(invitations.expiresAt), sortOrder(invitations.id))
        .limit(reqDto.limit)
        .offset(reqDto.offset),
      this.db.$count(invitations, filter),
    ]);

    return new OffsetPaginatedDto(
      plainToInstance(PageInvitationResDto, entities, {
        excludeExtraneousValues: true,
      }),
      totalRecords,
      reqDto.limit,
      reqDto.page,
    );
  }

  /**
   * Email từng được mời để gợi ý mời lại: lấy lời mời gần nhất của từng email, chỉ giữ cái đã hết hạn hoặc
   * bị thu hồi.
   *
   * Rules:
   * - Lời mời gần nhất đã chấp nhận hoặc còn hạn thì email không hiện; người đang có vai trò cũng không hiện.
   */
  async getInvitationSuggestions(
    reqDto: GetInvitationSuggestionsReqDto,
  ): Promise<InvitationSuggestionResDto[]> {
    const now = new Date();
    const newerInvitations = alias(invitations, 'newer_invitations');
    const lastInvitations = await this.db
      .select({
        email: invitations.email,
        acceptedAt: invitations.acceptedAt,
        revokedAt: invitations.revokedAt,
        expiresAt: invitations.expiresAt,
        invitedAt: invitations.createdAt,
      })
      .from(invitations)
      .where(
        and(
          or(
            isNotNull(invitations.revokedAt),
            and(
              isNull(invitations.acceptedAt),
              lte(invitations.expiresAt, now),
            ),
          ),
          reqDto.q
            ? like(invitations.email, `%${escapeLike(reqDto.q)}%`)
            : undefined,
          notExists(
            this.db
              .select({ id: newerInvitations.id })
              .from(newerInvitations)
              .where(
                and(
                  eq(newerInvitations.email, invitations.email),
                  gt(newerInvitations.createdAt, invitations.createdAt),
                ),
              ),
          ),
          notExists(
            this.db
              .select({ id: users.id })
              .from(users)
              .where(
                and(
                  eq(users.email, invitations.email),
                  isNotNull(users.roleId),
                  isNull(users.deletedAt),
                ),
              ),
          ),
        ),
      )
      .orderBy(desc(invitations.createdAt), desc(invitations.id))
      .limit(MAX_INVITATION_SUGGESTIONS);

    return plainToInstance(
      InvitationSuggestionResDto,
      lastInvitations.map((lastInvitation) => ({
        email: lastInvitation.email,
        status: resolveInvitationStatus(lastInvitation, now),
        invitedAt: lastInvitation.invitedAt,
      })),
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Tạo lời mời cho từng email; email đã có lời mời chờ thì cấp token mới và gia hạn.
   *
   * Rules:
   * - Người đã có vai trò không được tạo lời mời, trả `ALREADY_HAS_ACCESS`.
   */
  async createInvitations(
    currentUser: CurrentUser,
    reqDto: CreateInvitationsReqDto,
  ): Promise<InvitationResultResDto[]> {
    const emails = [...new Set(reqDto.emails)];

    const { role, invitationResults } = await this.db.transaction(
      async (tx) => {
        const role = await ensureCanGrantRole(tx, currentUser, reqDto.roleId);
        const emailsWithAccess = await this.loadEmailsWithAccess(tx, emails);
        const pendingInvitationIdByEmail =
          await this.loadPendingInvitationIdByEmail(
            tx,
            emails.filter((email) => !emailsWithAccess.has(email)),
            currentUser,
          );

        const invitationResults: InvitationResultResDto[] = [];
        for (const email of emails) {
          invitationResults.push(
            emailsWithAccess.has(email)
              ? {
                  email,
                  status: InvitationResultStatus.ALREADY_HAS_ACCESS,
                  token: null,
                  emailStatus: InvitationEmailStatus.NOT_REQUESTED,
                }
              : await this.upsertInvitation(
                  tx,
                  email,
                  reqDto.roleId,
                  currentUser.id,
                  pendingInvitationIdByEmail.get(email),
                ),
          );
        }
        return { role, invitationResults };
      },
    );

    const emailedResults = reqDto.shouldSendEmail
      ? await this.sendInvitationEmails(invitationResults, {
          inviterName: currentUser.displayName,
          roleName: role.name,
        })
      : invitationResults;
    return plainToInstance(InvitationResultResDto, emailedResults, {
      excludeExtraneousValues: true,
    });
  }

  /** Gửi sau khi commit: lỗi mail không được làm mất lời mời, người mời vẫn chép được link. */
  async sendInvitationEmails(
    invitationResults: InvitationResultResDto[],
    emailContent: InvitationEmailContent,
  ): Promise<InvitationResultResDto[]> {
    const invitedResults = invitationResults.flatMap((invitationResult) =>
      invitationResult.token === null
        ? []
        : [{ invitationResult, token: invitationResult.token }],
    );
    if (invitedResults.length === 0) {
      return invitationResults;
    }

    const webOrigin = this.configService.getOrThrow('app.webOrigin', {
      infer: true,
    });
    const deliveryStatuses = await this.emailOutboxService.sendOrQueue(
      invitedResults.map(({ invitationResult, token }) => ({
        to: invitationResult.email,
        invitationTokenHash: hashInvitationToken(token),
        ...buildInvitationEmail({
          ...emailContent,
          link: `${webOrigin}/invitations/${token}`,
          ttlDays: INVITATION_TTL_DAYS,
        }),
      })),
    );
    for (const [index, { invitationResult }] of invitedResults.entries()) {
      invitationResult.emailStatus =
        invitationEmailStatusByDelivery[deliveryStatuses[index]];
    }
    return invitationResults;
  }

  /** Link cũ hết hiệu lực ngay vì `token_hash` bị thay. */
  async regenerateInvitation(
    invitationId: string,
    currentUser: CurrentUser,
  ): Promise<InvitationTokenResDto> {
    return this.db.transaction(async (tx) => {
      const pendingInvitation = await this.ensurePendingInvitationExists(
        tx,
        invitationId,
      );
      await ensureCanGrantRole(tx, currentUser, pendingInvitation.roleId);
      const { token, tokenHash } = generateInvitationToken();
      await tx
        .update(invitations)
        .set({ tokenHash, expiresAt: buildExpiresAt() })
        .where(eq(invitations.id, pendingInvitation.id));
      return plainToInstance(
        InvitationTokenResDto,
        { token },
        { excludeExtraneousValues: true },
      );
    });
  }

  async revokeInvitation(
    invitationId: string,
    currentUser: CurrentUser,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const pendingInvitation = await this.ensurePendingInvitationExists(
        tx,
        invitationId,
      );
      await ensureCanGrantRole(tx, currentUser, pendingInvitation.roleId);
      await tx
        .update(invitations)
        .set({ revokedAt: new Date() })
        .where(eq(invitations.id, pendingInvitation.id));
    });
  }

  /**
   * Đọc trước khi đăng nhập (trang đăng ký bằng email/mật khẩu).
   *
   * Rules:
   * - Chỉ trả email và trạng thái; token 256 bit nên người cầm link biết email được mời là chấp nhận được.
   */
  async getInvitationEmail(token: string): Promise<InvitationEmailResDto> {
    const [invitation] = await this.db
      .select({
        email: invitations.email,
        expiresAt: invitations.expiresAt,
        acceptedAt: invitations.acceptedAt,
        revokedAt: invitations.revokedAt,
      })
      .from(invitations)
      .where(eq(invitations.tokenHash, hashInvitationToken(token)))
      .limit(1);
    if (!invitation) {
      throw new AppException(ErrorCode.E016, HttpStatus.NOT_FOUND);
    }
    const status = resolveInvitationStatus(invitation, new Date());
    return plainToInstance(
      InvitationEmailResDto,
      {
        email: status === InvitationStatus.PENDING ? invitation.email : null,
        status,
      },
      { excludeExtraneousValues: true },
    );
  }

  /** Ai có link cũng xem được, nên chỉ trả thông tin đủ để người nhận quyết định tham gia. */
  async getInvitation(
    token: string,
    currentUser: CurrentUser,
  ): Promise<InvitationResDto> {
    const [invitation] = await this.db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: getTableColumns(roles),
        invitedByName: users.displayName,
        expiresAt: invitations.expiresAt,
        acceptedAt: invitations.acceptedAt,
        revokedAt: invitations.revokedAt,
      })
      .from(invitations)
      .innerJoin(roles, eq(roles.id, invitations.roleId))
      .leftJoin(users, eq(users.id, invitations.invitedBy))
      .where(eq(invitations.tokenHash, hashInvitationToken(token)))
      .limit(1);
    if (!invitation) {
      throw new AppException(ErrorCode.E016, HttpStatus.NOT_FOUND);
    }
    return plainToInstance(
      InvitationResDto,
      {
        ...invitation,
        status: resolveInvitationStatus(invitation, new Date()),
        isEmailMatched: invitation.email === currentUser.email.toLowerCase(),
        hasAccess: Boolean(currentUser.role),
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Người đăng nhập đúng email được mời nhận vai trò ghi trong lời mời.
   *
   * Rules:
   * - Khoá dòng lời mời (`for update`) để một link không được chấp nhận hai lần.
   * - Đã có vai trò thì giữ vai trò hiện có.
   */
  async acceptInvitation(
    token: string,
    currentUser: CurrentUser,
  ): Promise<void> {
    const tokenHash = hashInvitationToken(token);
    await this.db.transaction(async (tx) => {
      const [invitation] = await tx
        .select()
        .from(invitations)
        .where(eq(invitations.tokenHash, tokenHash))
        .limit(1)
        .for('update');
      if (!invitation) {
        throw new AppException(ErrorCode.E016, HttpStatus.NOT_FOUND);
      }
      const acceptError =
        acceptErrorByStatus[resolveInvitationStatus(invitation, new Date())];
      if (acceptError) {
        throw new AppException(acceptError, HttpStatus.CONFLICT);
      }
      if (invitation.email !== currentUser.email.toLowerCase()) {
        throw new AppException(ErrorCode.E020, HttpStatus.FORBIDDEN);
      }

      await tx
        .update(users)
        .set({ roleId: invitation.roleId })
        .where(and(eq(users.id, currentUser.id), isNull(users.roleId)));
      await tx
        .update(invitations)
        .set({ acceptedAt: new Date(), acceptedBy: currentUser.id })
        .where(eq(invitations.id, invitation.id));
    });
  }

  /**
   * Lời mời đang chờ của các email sắp mời, để gia hạn dòng cũ thay vì chèn dòng mới.
   *
   * Rules:
   * - Khoá (`for update`) để hai lần mời cùng email không cùng chèn dòng mới.
   * - Gia hạn lời mời chờ do người khác tạo cũng phải trao được vai trò cũ của lời mời đó.
   */
  private async loadPendingInvitationIdByEmail(
    tx: DbTransaction,
    emails: string[],
    currentUser: CurrentUser,
  ): Promise<Map<string, string>> {
    if (emails.length === 0) {
      return new Map();
    }
    const pendingInvitations = await tx
      .select({
        id: invitations.id,
        email: invitations.email,
        roleId: invitations.roleId,
      })
      .from(invitations)
      .where(inArray(invitations.activeEmail, emails))
      .for('update');
    for (const roleId of new Set(
      pendingInvitations.map((invitation) => invitation.roleId),
    )) {
      await ensureCanGrantRole(tx, currentUser, roleId);
    }
    return new Map(
      pendingInvitations.map((invitation) => [invitation.email, invitation.id]),
    );
  }

  private async upsertInvitation(
    tx: DbTransaction,
    email: string,
    roleId: string,
    actorId: string,
    pendingInvitationId: string | undefined,
  ): Promise<InvitationResultResDto> {
    const { token, tokenHash } = generateInvitationToken();
    const expiresAt = buildExpiresAt();
    if (pendingInvitationId) {
      await tx
        .update(invitations)
        .set({ roleId, tokenHash, invitedBy: actorId, expiresAt })
        .where(eq(invitations.id, pendingInvitationId));
    } else {
      await tx.insert(invitations).values({
        email,
        roleId,
        tokenHash,
        invitedBy: actorId,
        expiresAt,
      });
    }
    return {
      email,
      status: InvitationResultStatus.INVITED,
      token,
      emailStatus: InvitationEmailStatus.NOT_REQUESTED,
    };
  }

  private async loadEmailsWithAccess(
    tx: DbTransaction,
    emails: string[],
  ): Promise<Set<string>> {
    const usersWithAccess = await tx
      .select({ email: users.email })
      .from(users)
      .where(
        and(
          inArray(users.email, emails),
          isNotNull(users.roleId),
          isNull(users.deletedAt),
        ),
      );
    return new Set(usersWithAccess.map((user) => user.email.toLowerCase()));
  }

  /** Lời mời còn chờ (chưa dùng, chưa thu hồi); khoá dòng để tạo lại và thu hồi không chen nhau. */
  private async ensurePendingInvitationExists(
    tx: DbTransaction,
    invitationId: string,
  ): Promise<Pick<InvitationSelect, 'id' | 'roleId'>> {
    const [pendingInvitation] = await tx
      .select({ id: invitations.id, roleId: invitations.roleId })
      .from(invitations)
      .where(
        and(
          eq(invitations.id, invitationId),
          isNull(invitations.acceptedAt),
          isNull(invitations.revokedAt),
        ),
      )
      .limit(1)
      .for('update');
    if (!pendingInvitation) {
      throw new AppException(ErrorCode.E016, HttpStatus.NOT_FOUND);
    }
    return pendingInvitation;
  }
}
