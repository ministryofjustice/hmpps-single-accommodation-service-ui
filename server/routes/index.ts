import { Router } from 'express'
import { Services } from '../services'
import { controllers } from '../controllers'
import uiPaths from '../paths/ui'

export default function routes(services: Services): Router {
  const router = Router()
  const { casesController, proposedAddressesController } = controllers(services)

  router.get(uiPaths.cases.index.pattern, casesController.index())
  router.get(uiPaths.cases.search.pattern, casesController.search())
  router.get(uiPaths.cases.show.pattern, casesController.show())

  router.get(uiPaths.proposedAddresses.start.pattern, proposedAddressesController.start())
  router.get(uiPaths.proposedAddresses.details.pattern, proposedAddressesController.details())
  router.get(uiPaths.proposedAddresses.type.pattern, proposedAddressesController.type())
  router.get(uiPaths.proposedAddresses.status.pattern, proposedAddressesController.status())
  router.get(uiPaths.proposedAddresses.checkYourAnswers.pattern, proposedAddressesController.checkYourAnswers())
  router.post(uiPaths.proposedAddresses.submit.pattern, proposedAddressesController.submit())
  router.get(uiPaths.proposedAddresses.cancel.pattern, proposedAddressesController.cancel())

  return router
}
