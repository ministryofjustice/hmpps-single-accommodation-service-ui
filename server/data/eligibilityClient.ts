import { asUser } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ApiResponseDtoEligibilityDto } from '@sas/api'
import SasApiClient from './sasApiClient'
import apiPaths from '../paths/api'

export default class EligibilityClient extends SasApiClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Eligibility client', authenticationClient)
  }

  getEligibility(token: string, crn: string) {
    return this.get<ApiResponseDtoEligibilityDto>({ path: apiPaths.cases.eligibility({ crn }) }, asUser(token))
  }
}
