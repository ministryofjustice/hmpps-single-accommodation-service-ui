import { Router } from 'express'
import RequestOptions from '@ministryofjustice/hmpps-probation-frontend-components/dist/types/RequestOptions'
import pdsComponents from '@ministryofjustice/hmpps-probation-frontend-components'
import config from '../config'
import logger from '../../logger'

export default () => {
  const router = Router()

  const options: RequestOptions = {
    pdsUrl: config.apis.probationApi.url,
    logger,
    useFallbacksByDefault: config.environmentName === 'integration-test',
  }

  router.get('/{*any}', pdsComponents.getPageComponents(options))

  return router
}
