import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { AccommodationReferralDto as Referral } from '@sas/api'
import config from '../config'
import logger from '../../logger'

export default class ReferralsClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Referral client', config.apis.sasApi, logger, authenticationClient)
  }

  getReferralHistory(token: string, crn: string) {
    return this.get<Referral[]>({ path: `/application-histories/${crn}` }, asUser(token))
  }
}
