import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHasPermission } from '@/hooks/use-has-permission'
import {
  invitationsQueryOptions,
  rolesQueryOptions,
  usersQueryOptions,
} from '../../api'
import { InvitationsPanel } from './InvitationsPanel'
import { RolesPanel } from './RolesPanel'
import { UsersPanel } from './UsersPanel'

export function UsersTabs() {
  const { tab } = useSearch({ from: '/(authed)/users' })
  const navigate = useNavigate({ from: '/users' })
  const canInvite = useHasPermission('users:invite')
  const canReadRoles = useHasPermission('roles:read')
  // URL có thể trỏ tới tab mình không được xem (link người khác gửi), khi đó về tab Người dùng.
  const activeTab =
    (tab === 'invitations' && canInvite) || (tab === 'roles' && canReadRoles)
      ? tab
      : 'users'

  // Số trên tab lấy từ danh sách chưa lọc; trùng query key với `UserStatCards` nên không gọi thừa.
  const { data: users } = useQuery(usersQueryOptions({}))
  const { data: invitations } = useQuery({
    ...invitationsQueryOptions({}),
    enabled: canInvite,
  })
  const { data: roles } = useQuery({
    ...rolesQueryOptions(),
    enabled: canReadRoles,
  })

  return (
    <Tabs
      value={activeTab}
      onValueChange={(nextTab) =>
        navigate({
          search: {
            tab:
              nextTab === 'invitations' || nextTab === 'roles'
                ? nextTab
                : undefined,
          },
        })
      }
      className="gap-0 overflow-hidden rounded-lg bg-card shadow-card"
    >
      <div className="overflow-x-auto overflow-y-hidden border-b px-4 scrollbar-none sm:px-5">
        <TabsList
          variant="line"
          // Biến thể của shadcn cố định `group-data-horizontal/tabs:h-8`, phải ghi đè đúng class đó mới đổi được chiều cao.
          className="gap-6 p-0 group-data-horizontal/tabs:h-12"
        >
          <TabsTrigger
            value="users"
            className="h-full flex-none gap-2.5 px-0 text-sm text-muted-foreground after:bg-primary hover:text-foreground data-active:text-primary group-data-horizontal/tabs:after:bottom-0"
          >
            Người dùng
            <TabCount count={users?.pagination.totalRecords} />
          </TabsTrigger>
          {canInvite && (
            <TabsTrigger
              value="invitations"
              className="h-full flex-none gap-2.5 px-0 text-sm text-muted-foreground after:bg-primary hover:text-foreground data-active:text-primary group-data-horizontal/tabs:after:bottom-0"
            >
              Lời mời đang chờ
              <TabCount count={invitations?.pagination.totalRecords} />
            </TabsTrigger>
          )}
          {canReadRoles && (
            <TabsTrigger
              value="roles"
              className="h-full flex-none gap-2.5 px-0 text-sm text-muted-foreground after:bg-primary hover:text-foreground data-active:text-primary group-data-horizontal/tabs:after:bottom-0"
            >
              Vai trò
              <TabCount count={roles?.length} />
            </TabsTrigger>
          )}
        </TabsList>
      </div>
      <TabsContent value="users" className="p-4 sm:p-5">
        <UsersPanel />
      </TabsContent>
      {canInvite && (
        <TabsContent value="invitations" className="p-4 sm:p-5">
          <InvitationsPanel />
        </TabsContent>
      )}
      {canReadRoles && (
        <TabsContent value="roles" className="p-4 sm:p-5">
          <RolesPanel />
        </TabsContent>
      )}
    </Tabs>
  )
}

function TabCount({ count }: { count: number | undefined }) {
  if (count === undefined) {
    return null
  }
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-2xs font-bold text-muted-foreground tabular-nums in-data-active:bg-primary in-data-active:text-primary-foreground">
      {count}
    </span>
  )
}
