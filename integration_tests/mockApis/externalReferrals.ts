import type { SuperAgentRequest } from 'superagent'
import { ExternalReferralDto } from '@sas/api'
import { stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'
import { apiResponseFactory, externalReferralFactory } from '../../server/testutils/factories'

export default {
  stubGetExternalReferralBySubmissionId: (referral: ExternalReferralDto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.externalReferrals.show({ crn: referral.crn, id: referral.submission.id }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.externalReferral(referral),
      },
    }),

  stubSubmitExternalReferral: (crn: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.cases.externalReferrals.submit({ crn }),
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: externalReferralFactory.submitted().build(),
      },
    }),

  stubUpdateExternalReferral: (referral: ExternalReferralDto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'PUT',
        urlPattern: apiPaths.cases.externalReferrals.update({ crn: referral.crn, id: referral.submission.id }),
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: externalReferralFactory.submitted().build(),
      },
    }),

  stubListExternalReferral: (crn: string, list: Array<ExternalReferralDto>): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.externalReferrals.search({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.externalReferrals(list),
      },
    }),
}
