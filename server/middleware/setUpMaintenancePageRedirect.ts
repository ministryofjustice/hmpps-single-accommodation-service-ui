import express, { Router } from 'express'
import config from '../config'
import paths from '../paths/ui'

export default function setUpMaintenancePageRedirect(): Router {
  const router = express.Router()
  const allowedPaths = ['/sign-in', '/sign-in/callback', '/health', '/maintenance']

  router.use((req, res, next) => {
    const allowedUsernames = process.env.MAINTENANCE_MODE_ALLOWLIST?.split(',').map(u => u.trim()) || []
    const maintenanceModeEnabledForUser =
      config.flags.maintenanceMode && !allowedUsernames.includes(res.locals?.user?.username)

    if (maintenanceModeEnabledForUser && !allowedPaths.includes(req.path)) {
      return res.redirect(302, paths.static.maintenance({}))
    }

    if (!maintenanceModeEnabledForUser && req.path === '/maintenance') {
      return res.redirect(302, '/')
    }

    return next()
  })

  return router
}
