import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import {
  ExternalReferralDto,
  ExternalReferralCommand,
  ApiResponseDtoExternalReferralDto,
  ApiResponseDtoListExternalReferralDto,
  ApiResponseDtoListAuditRecordDto,
} from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class ExternalReferralsClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Other Accommodation Referral client', config.apis.sasApi, logger, authenticationClient)
  }

  search(token: string, crn: string) {
    return this.get<ApiResponseDtoListExternalReferralDto>(
      {
        path: apiPaths.cases.externalReferrals.search({ crn }),
      },
      asUser(token),
    )
  }

  getExternalReferralBySubmissionId(token: string, crn: string, id: string) {
    return this.get<ApiResponseDtoExternalReferralDto>(
      { path: apiPaths.cases.externalReferrals.show({ crn, id }) },
      asUser(token),
    )
  }

  submit(token: string, crn: string, externalReferral: ExternalReferralCommand) {
    return this.post<ExternalReferralDto>(
      {
        path: apiPaths.cases.externalReferrals.submit({ crn }),
        data: externalReferral,
      },
      asUser(token),
    )
  }

  update(token: string, crn: string, id: string, externalReferral: ExternalReferralCommand) {
    return this.put<void>(
      {
        path: apiPaths.cases.externalReferrals.update({ crn, id }),
        data: externalReferral,
      },
      asUser(token),
    )
  }

  async getTimeline(token: string, crn: string, id: string) {
    return this.get<ApiResponseDtoListAuditRecordDto>(
      { path: apiPaths.cases.externalReferrals.timeline({ crn, id }) },
      asUser(token),
    )
  }
}
