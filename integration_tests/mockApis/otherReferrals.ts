import type { SuperAgentRequest } from 'superagent'
import { OtherAccommodationReferralDto } from '@sas/api'
import { stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'
import { apiResponseFactory, otherAccommodationReferralFactory } from '../../server/testutils/factories'

export default {
  stubGetOtherReferralBySubmissionId: (
    crn: string,
    submissionId: string,
    referral?: OtherAccommodationReferralDto,
  ): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.otherReferrals.show({ crn, id: submissionId }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.otherReferral(referral || otherAccommodationReferralFactory.submitted().build()),
      },
    }),

  stubSubmitOtherReferral: (crn: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.cases.otherReferrals.submit({ crn }),
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: otherAccommodationReferralFactory.submitted().build(),
      },
    }),
}
