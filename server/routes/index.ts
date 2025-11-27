import { Router } from 'express'
import { Services } from '../services'
import { controllers } from '../controllers'

export default function routes(services: Services): Router {
  const router = Router()
  const { casesController } = controllers(services)

  router.get('/', casesController.index())

  return router
}
