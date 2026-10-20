import { Router } from 'express'
import { Services } from '../services'
import { controllers } from '../controllers'
import uiPaths from '../paths/ui'
import proposedAddressesRoutes from './proposedAddresses'
import currentAddressRoutes from './currentAddress'
import dutyToReferRoutes from './dutyToRefer'
import externalReferralsRoutes from './externalReferrals'
import customListRoutes from './customList'

export default function routes(services: Services): Router {
  const router = Router()
  const {
    casesController,
    proposedAddressesController,
    currentAddressController,
    dutyToReferController,
    externalReferralsController,
    customListController,
    staticController,
  } = controllers(services)

  router.get(uiPaths.cases.index.pattern, casesController.index())
  router.get(uiPaths.cases.search.pattern, casesController.search())
  router.get(uiPaths.cases.show.pattern, casesController.show())

  proposedAddressesRoutes(router, proposedAddressesController)
  currentAddressRoutes(router, currentAddressController)
  dutyToReferRoutes(router, dutyToReferController)
  externalReferralsRoutes(router, externalReferralsController)
  customListRoutes(router, customListController)

  router.get(uiPaths.static.maintenance.pattern, staticController.maintenance())

  return router
}
