import { AsyncLocalStorage } from 'node:async_hooks'

export type RequestContext = {
  probationRegion?: string
}

// Scoped to the async execution of a single incoming request, so values never leak between concurrent users
const storage = new AsyncLocalStorage<RequestContext>()

export const runWithRequestContext = <T>(context: RequestContext, callback: () => T): T =>
  storage.run(context, callback)

export const getRequestContext = (): RequestContext | undefined => storage.getStore()
