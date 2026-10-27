import { useRouteContext } from '@tanstack/react-router'
import { UserPlusRoundedIcon } from '@solar-icons/react/linear'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { InvitationLinkList } from '@/components/shared/composites/InvitationLinkList'
import {
  buildInvitationLink,
  INVITATION_TTL_DAYS,
  MAX_INVITATION_EMAILS,
} from '@/lib/invitation'
import type { InvitationResult } from '@/lib/types/invitation.type'
import { rolesQueryOptions } from '../../api'
import { useCreateInvitations } from '../../hooks/use-create-invitations'
import { createInvitationsFormSchema } from '../../schemas/invitation.schema'
import type { CreateInvitationsFormSchema } from '../../schemas/invitation.schema'
import { canGrantRole } from '../../utils/grant'
import { InviteEmailsInput } from './InviteEmailsInput'

const defaultValues: CreateInvitationsFormSchema = {
  emails: [],
  roleId: '',
  shouldSendEmail: true,
}

/**
 * Hai bước trong cùng một dialog: nhập email rồi xem link của từng người.
 *
 * Rules:
 * - Không mời thẳng vào vai trò hệ thống, chỉ chọn vai trò mình trao được (khớp luật ở `api`).
 */
export function CreateInvitationsDialog() {
  const { currentUser } = useRouteContext({ from: '/(authed)' })
  const [isOpen, setIsOpen] = useState(false)
  const { data: roles = [] } = useQuery({
    ...rolesQueryOptions(),
    enabled: isOpen,
  })
  const invitableRoles = roles.filter((role) => canGrantRole(currentUser, role))
  const [invitationResults, setInvitationResults] = useState<
    InvitationResult[] | null
  >(null)
  const { mutate: createInvitations, isPending } = useCreateInvitations()

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: createInvitationsFormSchema },
    onSubmit: ({ value }) =>
      createInvitations(value, { onSuccess: setInvitationResults }),
  })

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen)
    if (!nextOpen) {
      form.reset()
      setInvitationResults(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" />}>
        <UserPlusRoundedIcon />
        Mời người dùng
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mời người dùng</DialogTitle>
          <DialogDescription>
            {invitationResults
              ? 'Link chỉ hiện một lần, hãy gửi cho những người chưa nhận được email qua Zalo hoặc Messenger.'
              : `Người được mời đăng nhập (Google hoặc tạo mật khẩu) bằng đúng email này để vào hệ thống. Link có hiệu lực ${INVITATION_TTL_DAYS} ngày.`}
          </DialogDescription>
        </DialogHeader>
        {invitationResults ? (
          <InvitationResultsStep invitationResults={invitationResults} />
        ) : (
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (form.state.isSubmitting) {
                return
              }
              void form.handleSubmit()
            }}
          >
            <FieldGroup>
              <form.Field name="emails">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>Email</FieldLabel>
                      <InviteEmailsInput
                        emails={field.state.value}
                        isInvalid={isInvalid}
                        onEmailsChange={field.handleChange}
                        onBlur={field.handleBlur}
                      />
                      <FieldDescription>
                        {`Gõ hoặc dán email, bấm Enter hoặc dấu phẩy để thêm. Đã nhập ${field.state.value.length}/${MAX_INVITATION_EMAILS} email.`}
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>
              <form.Field name="roleId">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  return (
                    <FieldSet className="gap-2" data-invalid={isInvalid}>
                      <FieldLegend variant="label">Vai trò</FieldLegend>
                      {invitableRoles.length === 0 && (
                        <FieldDescription>
                          Chưa có vai trò nào bạn được phép mời. Cần người có
                          quyền quản lý vai trò tạo vai trò trước.
                        </FieldDescription>
                      )}
                      <div className="grid gap-2 sm:grid-cols-2">
                        {invitableRoles.map((role) => (
                          <label
                            key={role.id}
                            className="flex cursor-pointer flex-col gap-1 rounded-md border p-3 transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-violet-soft has-focus-visible:ring-2 has-focus-visible:ring-ring/50"
                          >
                            <input
                              type="radio"
                              name={field.name}
                              value={role.id}
                              checked={field.state.value === role.id}
                              aria-invalid={isInvalid}
                              onBlur={field.handleBlur}
                              onChange={() => field.handleChange(role.id)}
                              className="sr-only"
                            />
                            <span className="text-sm font-semibold text-foreground">
                              {role.name}
                            </span>
                            {role.description && (
                              <span className="text-xs text-muted-foreground">
                                {role.description}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </FieldSet>
                  )
                }}
              </form.Field>
              <form.Field name="shouldSendEmail">
                {(field) => (
                  <Field orientation="horizontal">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                    <div className="flex flex-col gap-0.5">
                      <FieldLabel htmlFor={field.name}>
                        Gửi email mời cho những người này
                      </FieldLabel>
                      <FieldDescription>
                        Link vẫn hiện ở bước sau để bạn gửi thêm qua Zalo.
                      </FieldDescription>
                    </div>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                Tạo link mời
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

type InvitationResultsStepProps = {
  invitationResults: InvitationResult[]
}

function InvitationResultsStep({
  invitationResults,
}: InvitationResultsStepProps) {
  const invitationLinks = invitationResults.flatMap(
    ({ email, token, emailStatus }) =>
      token ? [{ email, link: buildInvitationLink(token), emailStatus }] : [],
  )
  const sentCount = invitationLinks.filter(
    ({ emailStatus }) => emailStatus === 'SENT',
  ).length
  const isMailDisabled = invitationLinks.some(
    ({ emailStatus }) => emailStatus === 'DISABLED',
  )
  const existingEmails = invitationResults
    .filter(({ status }) => status === 'ALREADY_HAS_ACCESS')
    .map(({ email }) => email)

  return (
    <div className="flex flex-col gap-4">
      {sentCount > 0 && (
        <p className="text-sm font-medium text-success-ink">
          Đã gửi email cho {sentCount} người.
        </p>
      )}
      {isMailDisabled && (
        <p className="text-xs text-muted-foreground">
          Máy chủ chưa cấu hình gửi email, hãy gửi link thủ công.
        </p>
      )}
      {invitationLinks.length > 0 && (
        <InvitationLinkList invitationLinks={invitationLinks} />
      )}
      {existingEmails.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Đã có quyền vào hệ thống, không tạo lời mời:{' '}
          {existingEmails.join(', ')}
        </p>
      )}
    </div>
  )
}
