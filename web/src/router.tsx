import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { PagePending } from '@/components/shared/primitives/PagePending'
import { RouteError } from '@/components/shared/composites/RouteError'
import { RouteNotFound } from '@/components/shared/composites/RouteNotFound'
import { SESSION_EXPIRED_MESSAGE } from '@/lib/error-messages'
import { routeTree } from './routeTree.gen'

const QUERY_STALE_TIME_MS = 30_000
const QUERY_GC_TIME_MS = 15 * 60_000

export function getRouter() {
  // Phiên hết hạn ở bất kỳ truy vấn nào: bỏ cache rồi chạy lại guard `(authed)` để về trang
  // đăng nhập. Chỉ làm ở trình duyệt; lúc SSR, guard của lần tải sau đã tự xử lý.
  const handleSessionExpired = (error: Error): void => {
    if (router.isServer || error.message !== SESSION_EXPIRED_MESSAGE) {
      return
    }
    queryClient.clear()
    void router.invalidate()
  }

  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: handleSessionExpired }),
    mutationCache: new MutationCache({ onError: handleSessionExpired }),
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        gcTime: QUERY_GC_TIME_MS,
        // Phiên đã hết hạn thì gọi lại cũng vô ích.
        retry: (failureCount, error) =>
          failureCount < 1 && error.message !== SESSION_EXPIRED_MESSAGE,
        refetchOnWindowFocus: false,
      },
    },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // React Query quản lý độ tươi của dữ liệu, nên router không tự giữ cache riêng.
    defaultPreload: 'intent',
    defaultStaleTime: 0,
    defaultPreloadStaleTime: 0,
    defaultStructuralSharing: true,
    // Pending hiện sau 300ms (mặc định 1000ms) để chuyển trang chậm vẫn có phản hồi sớm; pendingMinMs
    // giữ mặc định 500ms để không nháy khi dữ liệu về ngay sau đó.
    defaultPendingMs: 300,
    defaultPendingComponent: PagePending,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: RouteNotFound,
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    handleRedirects: true,
    wrapQueryClient: true,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
