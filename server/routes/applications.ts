import { Router } from 'express'
import type ApplicationsController from '../controllers/applicationsController'
import uiPaths from '../paths/ui'

export default function applicationsRoutes(router: Router, applicationsController: ApplicationsController): void {
  router.get(uiPaths.applications.arrival.pattern, applicationsController.arrival())
  router.post(uiPaths.applications.arrival.pattern, applicationsController.saveArrival())
}
