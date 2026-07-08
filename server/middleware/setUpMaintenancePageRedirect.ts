import express, { Router } from 'express'
import config from '../config'
import paths from '../paths/ui'

export default function setUpMaintenancePageRedirect(): Router {
  const router = express.Router()
  const allowedPaths = ['/sign-in', '/sign-in/callback', '/health', '/maintenance']

  router.use((req, res, next) => {
    const allowedUsernames = config.flags.maintenanceModeAllowlist.split(',').map(u => u.trim()) || []
    const maintenanceMode = config.flags.maintenanceMode && !allowedUsernames.includes(res.locals?.user?.username)

    if (maintenanceMode && !allowedPaths.includes(req.path)) {
      return res.redirect(302, paths.static.maintenance({}))
    }

    if (!maintenanceMode && req.path === '/maintenance') {
      return res.redirect(302, '/')
    }

    return next()
  })

  return router
}
