import { Router } from 'express'
import { Services } from '../services'
import { controllers } from '../controllers'
import uiPaths from '../paths/ui'
import proposedAddressesRoutes from './proposedAddresses'
import dutyToReferRoutes from './dutyToRefer'

export default function routes(services: Services): Router {
  const router = Router()
  const { casesController, proposedAddressesController, dutyToReferController, staticController } = controllers(services)

  router.get(uiPaths.cases.index.pattern, casesController.index())
  router.get(uiPaths.cases.search.pattern, casesController.search())
  router.get(uiPaths.cases.show.pattern, casesController.show())

  proposedAddressesRoutes(router, proposedAddressesController)
  dutyToReferRoutes(router, dutyToReferController)

  router.get(uiPaths.static.notAuthorised.pattern, staticController.notAuthorised())
  router.get(uiPaths.static.maintenance.pattern, staticController.maintenance())
  router.get(uiPaths.static.notFound.pattern, staticController.notFound())

  return router
}
