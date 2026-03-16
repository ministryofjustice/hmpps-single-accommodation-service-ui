import { RequestHandler } from 'express'
import { type ParsedQs } from 'qs'

const trimStringValues = <T = Record<string, unknown> | ParsedQs>(data?: T): T =>
  data
    ? (Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
      ) as T)
    : data

export default function trimInput(): RequestHandler {
  return async (req, res, next) => {
    req.body = trimStringValues(req.body)
    req.query = trimStringValues(req.query)

    next()
  }
}
