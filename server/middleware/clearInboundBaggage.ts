import { context, propagation } from '@opentelemetry/api'
import type { RequestHandler } from 'express'

export default function clearInboundBaggage(): RequestHandler {
  return (_req, _res, next) => context.with(propagation.deleteBaggage(context.active()), next)
}
