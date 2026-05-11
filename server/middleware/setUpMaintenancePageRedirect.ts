import express, { Router } from 'express'
import config from '../config'
import paths from '../paths/ui'

export default function setUpMaintenancePageRedirect(): Router {
  const router = express.Router()
  const allowedPaths = ['/sign-in', '/sign-in/callback', '/health', '/maintenance']

  router.use((req, res, next) => {
    if (config.flags.maintenanceMode) {
      if (!allowedPaths.includes(req.path)) {
        return res.redirect(302, paths.static.maintenance({}))
      }
    }

    if (!config.flags.maintenanceMode && req.path === '/maintenance') {
      return res.redirect(302, '/')
    }

    return next()
  })

  return router
}
