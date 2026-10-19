import { asUser } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { ApiResponseDtoListAccommodationReferralDto } from '@sas/api'
import SasApiClient from './sasApiClient'
import apiPaths from '../paths/api'

export default class ReferralsClient extends SasApiClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Referral client', authenticationClient)
  }

  getReferralHistory(token: string, crn: string) {
    return this.get<ApiResponseDtoListAccommodationReferralDto>(
      { path: apiPaths.cases.referrals({ crn }) },
      asUser(token),
    )
  }
}
