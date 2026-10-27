import { revalidateLogic, useForm } from '@tanstack/react-form'
import type { z } from 'zod'
import { LinkButton } from '@/components/shared/primitives/LinkButton'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Permission } from '@/lib/types/role.type'
import { PermissionGroups } from '../composites/PermissionGroups'
import { RoleSummary } from './RoleSummary'

export type RoleFormValues = {
  name: string
  description: string
  permissions?: Permission[]
  // Chỉ trang sửa truyền: vai trò chưa tạo thì chưa đặt làm mặc định được.
  isDefault?: boolean
}

type RoleFormProps = {
  schema: z.ZodType<unknown, RoleFormValues>
  defaultValues: RoleFormValues
  submitLabel: string
  isPending: boolean
  onSubmit: (value: RoleFormValues) => void
}

/** Schema và lời gọi `api` do từng trang đưa vào. */
export function RoleForm({
  schema,
  defaultValues,
  submitLabel,
  isPending,
  onSubmit,
}: RoleFormProps) {
  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => onSubmit(value),
  })

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (form.state.isSubmitting) {
          return
        }
        void form.handleSubmit()
      }}
    >
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <section className="overflow-hidden rounded-lg bg-card shadow-card">
            <h2 className="border-b px-4 py-3 text-base font-semibold sm:px-5">
              Thông tin vai trò
            </h2>
            <FieldGroup className="p-4 sm:p-5">
              <form.Field name="name">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Tên vai trò</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        placeholder="Trưởng nhóm"
                        value={field.state.value}
                        aria-invalid={isInvalid}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>
              <form.Field name="description">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Mô tả</FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        rows={2}
                        placeholder="Vai trò này dành cho ai, làm việc gì"
                        value={field.state.value}
                        aria-invalid={isInvalid}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>
              {defaultValues.isDefault !== undefined && (
                <form.Field name="isDefault">
                  {(field) => (
                    <Field orientation="horizontal">
                      <Checkbox
                        id={field.name}
                        checked={field.state.value ?? false}
                        onCheckedChange={field.handleChange}
                      />
                      <div className="flex flex-col gap-0.5">
                        <FieldLabel htmlFor={field.name}>
                          Vai trò mặc định
                        </FieldLabel>
                        <FieldDescription>
                          Chỉ một vai trò được đặt mặc định.
                        </FieldDescription>
                      </div>
                    </Field>
                  )}
                </form.Field>
              )}
            </FieldGroup>
          </section>
          <div className="flex flex-col gap-0.5 pt-2">
            <h2 className="text-base font-semibold">Quyền</h2>
            <p className="text-sm text-muted-foreground">
              Người giữ vai trò được làm những việc đã chọn bên dưới.
            </p>
          </div>
          <form.Field name="permissions">
            {(field) => (
              <PermissionGroups
                permissions={field.state.value ?? []}
                onPermissionsChange={field.handleChange}
              />
            )}
          </form.Field>
        </div>
        <form.Subscribe selector={(state) => state.values.permissions}>
          {(permissions) => (
            <RoleSummary permissions={permissions ?? []}>
              <Button type="submit" disabled={isPending}>
                {submitLabel}
              </Button>
              <LinkButton
                to="/users"
                search={{ tab: 'roles' }}
                variant="outline"
              >
                Huỷ
              </LinkButton>
            </RoleSummary>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
