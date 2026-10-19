import express, { NextFunction, Request, Response } from 'express'
import type UserService from '../services/userService'
import { runWithRequestContext } from '../utils/requestContext'
import logger from '../../logger'

const getProbationRegion = async (req: Request, res: Response, userService: UserService) => {
  const { username, token } = res.locals.user
  const cached = req.session.userProbationRegion

  if (cached && cached.username === username) return cached.code

  try {
    const code = await userService.getProbationRegion(token)
    req.session.userProbationRegion = { username, code }
    return code
  } catch (error) {
    logger.error(error, `Failed to retrieve probation region for: ${username}`)
    return null
  }
}

export default function setUpUserProbationRegion(userService: UserService) {
  const router = express.Router()

  router.use(async (req: Request, res: Response, next: NextFunction) => {
    if (!res.locals.user?.token) return next()

    const probationRegion = await getProbationRegion(req, res, userService)

    return runWithRequestContext({ probationRegion: probationRegion ?? undefined }, () => next())
  })

  return router
}
