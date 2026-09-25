import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import {
  OtherAccommodationReferralDto,
  OtherAccommodationReferralCommand,
  ApiResponseDtoOtherAccommodationReferralDto,
  ApiResponseDtoListOtherAccommodationReferralDto,
} from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class OtherReferralsClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Other Accommodation Referral client', config.apis.sasApi, logger, authenticationClient)
  }

  search(token: string, crn: string) {
    return this.get<ApiResponseDtoListOtherAccommodationReferralDto>(
      {
        path: apiPaths.cases.otherReferrals.search({ crn }),
      },
      asUser(token),
    )
  }

  getOtherReferralBySubmissionId(token: string, crn: string, id: string) {
    return this.get<ApiResponseDtoOtherAccommodationReferralDto>(
      { path: apiPaths.cases.otherReferrals.show({ crn, id }) },
      asUser(token),
    )
  }

  submit(token: string, crn: string, otherReferral: OtherAccommodationReferralCommand) {
    return this.post<OtherAccommodationReferralDto>(
      {
        path: apiPaths.cases.otherReferrals.submit({ crn }),
        data: otherReferral,
      },
      asUser(token),
    )
  }

  update(token: string, crn: string, id: string, otherReferral: OtherAccommodationReferralCommand) {
    return this.put<void>(
      {
        path: apiPaths.cases.otherReferrals.update({ crn, id }),
        data: otherReferral,
      },
      asUser(token),
    )
  }
}
