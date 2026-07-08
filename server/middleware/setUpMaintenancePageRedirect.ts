import express, { Router } from 'express'
import config from '../config'
import paths from '../paths/ui'

export default function setUpMaintenancePageRedirect(): Router {
  const router = express.Router()
  const allowedPaths = ['/sign-in', '/sign-in/callback', '/health', '/maintenance']

  router.use((req, res, next) => {
    if (config.flags.maintenanceMode) {
      const allowedUsernames = process.env.MAINTENANCE_MODE_ALLOWLIST?.split(',').map(u => u.trim()) || []
      const currentUsername = res.locals?.user?.username

      if (!allowedPaths.includes(req.path) && !allowedUsernames.includes(currentUsername)) {
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
