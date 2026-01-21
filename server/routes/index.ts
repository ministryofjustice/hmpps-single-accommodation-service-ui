import { Router } from 'express'
import { Services } from '../services'
import { controllers } from '../controllers'
import uiPaths from '../paths/ui'

export default function routes(services: Services): Router {
  const router = Router()
  const { casesController, privateAddressController } = controllers(services)

  router.get(uiPaths.cases.index.pattern, casesController.index())
  router.get(uiPaths.cases.search.pattern, casesController.search())
  router.get(uiPaths.cases.show.pattern, casesController.show())

  router.get(uiPaths.privateAddress.start.pattern, privateAddressController.start())
  router.get(uiPaths.privateAddress.details.pattern, privateAddressController.details())
  router.get(uiPaths.privateAddress.type.pattern, privateAddressController.type())
  router.get(uiPaths.privateAddress.status.pattern, privateAddressController.status())
  router.get(uiPaths.privateAddress.checkYourAnswers.pattern, privateAddressController.checkYourAnswers())
  router.post(uiPaths.privateAddress.submit.pattern, privateAddressController.submit())
  router.get(uiPaths.privateAddress.cancel.pattern, privateAddressController.cancel())

  return router
}
