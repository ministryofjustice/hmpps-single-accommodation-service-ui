import { Router } from 'express'
import { Services } from '../services'
import { controllers } from '../controllers'
import uiPaths from '../paths/ui'

export default function routes(services: Services): Router {
  const router = Router()
  const { casesController } = controllers(services)

  router.get(uiPaths.cases.index.pattern, casesController.index())
  router.get(uiPaths.cases.show.pattern, casesController.show())

  return router
}
