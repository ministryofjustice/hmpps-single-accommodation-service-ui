import { context, propagation, trace, type Baggage } from '@opentelemetry/api'
import type { RequestHandler } from 'express'
import type UserService from '../services/userService'
import logger from '../../logger'
import { userLocationCodeKey } from '../utils/userLocationTelemetry'

export default function setUpUserTelemetry(userService: UserService): RequestHandler {
  return (req, res, next) =>
    // Only the authenticated API profile may supply baggage, never the browser.
    context.with(propagation.deleteBaggage(context.active()), async () => {
      let baggage: Baggage | undefined

      try {
        const { username, authSource, token } = res.locals.user
        let cached = req.session.userTelemetry

        if (cached?.username !== username || cached?.authSource !== authSource || !cached?.userLocationCode) {
          delete req.session.userTelemetry
          const userLocationCode = await userService.getUserLocationCode(token)
          cached = { username, authSource, userLocationCode }
          req.session.userTelemetry = cached
        }

        trace.getActiveSpan()?.setAttribute(userLocationCodeKey, cached.userLocationCode)
        baggage = propagation.createBaggage({
          [userLocationCodeKey]: { value: cached.userLocationCode },
        })
      } catch (error) {
        logger.warn(error, 'Unable to enrich telemetry with user location; will retry on the next request')
      }

      if (baggage) context.with(propagation.setBaggage(context.active(), baggage), next)
      else next()
    })
}
