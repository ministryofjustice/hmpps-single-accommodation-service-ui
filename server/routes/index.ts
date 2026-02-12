import { Router } from 'express'
import { Services } from '../services'
import { controllers } from '../controllers'
import uiPaths from '../paths/ui'
import proposedAddressesRoutes from './proposedAddresses'

export default function routes(services: Services): Router {
  const router = Router()
  const { casesController, proposedAddressesController } = controllers(services)

  router.get(uiPaths.cases.index.pattern, casesController.index())
  router.get(uiPaths.cases.search.pattern, casesController.search())
  router.get(uiPaths.cases.show.pattern, casesController.show())

  proposedAddressesRoutes(router, proposedAddressesController)

  return router
}
