import { Link } from '@tanstack/react-router'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export function RoleParentCrumb() {
  return (
    <>
      <BreadcrumbItem className="shrink-0">
        <BreadcrumbLink render={<Link to="/users" search={{ tab: 'roles' }} />}>
          Vai trò
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="shrink-0 [&>svg]:size-4" />
    </>
  )
}
