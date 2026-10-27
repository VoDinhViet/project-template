import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'
import { PageActionsSlotContext } from './PageActions'

type PageShellProps = {
  title: ReactNode
  parentCrumbs?: ReactNode
  actions?: ReactNode
  bodyClassName?: string
  children: ReactNode
}

export function PageShell({
  title,
  parentCrumbs,
  actions,
  bodyClassName,
  children,
}: PageShellProps) {
  const [pageActionsSlot, setPageActionsSlot] = useState<HTMLElement | null>(
    null,
  )

  return (
    // `SidebarInset` đã là `<main>` nên ở đây chỉ dùng `<div>`, tránh lồng hai landmark.
    <div className="flex flex-1 flex-col text-foreground">
      <div className="flex min-h-18.75 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5 lg:px-6">
        {parentCrumbs ? (
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap text-xl leading-tight font-bold">
              {parentCrumbs}
              <BreadcrumbItem className="min-w-0">
                {/* Không `capitalize` vì đây là tên do người dùng đặt (tên trang), phải giữ nguyên chữ hoa/thường. */}
                <h1
                  aria-current="page"
                  className="min-w-0 truncate text-foreground"
                >
                  {title}
                </h1>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <h1 className="min-w-0 truncate text-xl leading-tight font-bold text-foreground capitalize">
            {title}
          </h1>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <div ref={setPageActionsSlot} className="contents" />
          {actions}
        </div>
      </div>
      <div
        className={cn(
          'flex w-full flex-col gap-4 px-4 pb-4 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6',
          bodyClassName,
        )}
      >
        <PageActionsSlotContext value={pageActionsSlot}>
          {children}
        </PageActionsSlotContext>
      </div>
    </div>
  )
}
