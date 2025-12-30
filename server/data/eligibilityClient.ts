import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { EligibilityDto } from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class EligibilityClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Eligibility client', config.apis.sasApi, logger, authenticationClient)
  }

  getEligibility(token: string, crn: string) {
    return this.get<EligibilityDto>({ path: apiPaths.eligibility.show({ crn }) }, asUser(token))
  }
}
