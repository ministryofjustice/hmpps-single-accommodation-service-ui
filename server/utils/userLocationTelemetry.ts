import { context, propagation, type Span } from '@opentelemetry/api'
import type { ClientRequest, IncomingMessage } from 'http'

export const userLocationCodeKey = 'userLocationCode'

export function createUserLocationCodeRequestHook(sasApiUrl: string) {
  const sasApi = new URL(sasApiUrl)

  return (span: Span, request: ClientRequest | IncomingMessage) => {
    if (!('getHeader' in request)) return

    const userLocationCode = propagation.getBaggage(context.active())?.getEntry(userLocationCodeKey)?.value
    if (userLocationCode) span.setAttribute(userLocationCodeKey, userLocationCode)

    // HTTP instrumentation has already injected baggage at this point.
    if (request.protocol !== sasApi.protocol || request.getHeader('host') !== sasApi.host) {
      request.removeHeader('baggage')
    }
  }
}
