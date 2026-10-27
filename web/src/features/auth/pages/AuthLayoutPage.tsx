import { Outlet } from '@tanstack/react-router'

export function AuthLayoutPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background lg:flex-row">
      <aside className="hidden flex-1 flex-col justify-center gap-7 bg-primary px-15 py-14 text-primary-foreground lg:flex lg:w-1/2">
        <div className="max-w-110">
          <p className="mb-7.5 text-2xs font-bold tracking-wider text-primary-foreground/70 uppercase">
            Hệ thống quản lý dự án
          </p>
          <p className="text-3xl leading-tight font-semibold tracking-tight text-primary-foreground">
            Quản lý dự án và công việc
            <br />
            cho CLB Khoa CNTT và doanh nghiệp
          </p>
          <p className="mt-6 max-w-92 text-base leading-relaxed text-pretty text-primary-foreground/80">
            Theo dõi tiến độ, phân công và cộng tác trên một bảng làm việc
            chung.
          </p>
        </div>
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="block h-0.75 w-7 rounded-xs bg-primary-foreground/95" />
          <span className="block h-0.75 w-3 rounded-xs bg-primary-foreground/35" />
          <span className="block h-0.75 w-3 rounded-xs bg-primary-foreground/35" />
        </div>
      </aside>
      <main className="relative flex flex-1 flex-col items-center justify-center bg-card px-4 py-12 sm:px-8 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-120">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
