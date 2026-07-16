import { Router } from 'express'
import pdsComponents from '@ministryofjustice/hmpps-probation-frontend-components'
import config from '../config'
import logger from '../../logger'

export const frontendComponentsMiddleware = pdsComponents.getPageComponents({
  pdsUrl: config.apis.probationApi.url,
  logger,
  useFallbacksByDefault: config.environmentName === 'integration-test',
})

export default () => {
  const router = Router()

  router.get('/{*any}', frontendComponentsMiddleware)

  return router
}
