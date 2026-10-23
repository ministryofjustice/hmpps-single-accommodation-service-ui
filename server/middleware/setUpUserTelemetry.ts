import { context, propagation, trace } from '@opentelemetry/api'
import type { RequestHandler } from 'express'
import type UserService from '../services/userService'
import logger from '../../logger'
import { probationAreaCodeKey } from '../utils/probationAreaTelemetry'

export default function setUpUserTelemetry(userService: UserService): RequestHandler {
  return (req, res, next) =>
    // Only the authenticated API profile may supply baggage, never the browser.
    context.with(propagation.deleteBaggage(context.active()), async () => {
      const { username, authSource, token } = res.locals.user
      let cached = req.session.userTelemetry

      if (cached?.username !== username || cached?.authSource !== authSource || !cached?.userLocationCode) {
        delete req.session.userTelemetry

        try {
          const userLocationCode = await userService.getUserLocationCode(token)
          cached = { username, authSource, userLocationCode }
          req.session.userTelemetry = cached
        } catch (error) {
          logger.warn(error, 'Unable to enrich telemetry with user location; will retry on the next request')
          next()
          return
        }
      }

      trace.getActiveSpan()?.setAttribute(probationAreaCodeKey, cached.userLocationCode)
      const baggage = propagation.createBaggage({
        [probationAreaCodeKey]: { value: cached.userLocationCode },
      })

      context.with(propagation.setBaggage(context.active(), baggage), next)
    })
}
