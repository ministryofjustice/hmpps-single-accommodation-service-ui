import { ApiResponse } from '@sas/ui'

// eslint-disable-next-line import/prefer-default-export
export const collectApiResponses = async <T extends Record<string, Promise<ApiResponse>>>(requests: T) => {
  const entries = await Promise.all(
    Object.entries(requests).map(async ([key, request]) => {
      const response = await request
      return [key, response] as const
    }),
  )

  return {
    data: Object.fromEntries(entries.map(([key, response]) => [key, response.data])) as {
      [K in keyof T]: Awaited<T[K]>['data']
    },
    upstreamFailures: entries.filter(([, response]) => response.upstreamFailures?.length).map(([key]) => key),
  }
}
