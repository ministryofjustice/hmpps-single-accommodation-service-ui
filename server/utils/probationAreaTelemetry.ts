import { context, propagation, type Span } from '@opentelemetry/api'
import type { ClientRequest, IncomingMessage } from 'http'

export const probationAreaCodeKey = 'requestIdentifier'

export function createProbationAreaCodeRequestHook(sasApiUrl: string) {
  const sasApi = new URL(sasApiUrl)

  return (span: Span, request: ClientRequest | IncomingMessage) => {
    if (!('getHeader' in request)) return

    const probationAreaCode = propagation.getBaggage(context.active())?.getEntry(probationAreaCodeKey)?.value
    if (probationAreaCode) span.setAttribute(probationAreaCodeKey, probationAreaCode)

    // HTTP instrumentation has already injected baggage at this point.
    if (request.protocol !== sasApi.protocol || request.getHeader('host') !== sasApi.host) {
      request.removeHeader('baggage')
    }
  }
}
