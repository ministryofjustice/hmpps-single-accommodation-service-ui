import type { SuperAgentRequest } from 'superagent'
import { EligibilityDto } from '@sas/api'
import { stubFor } from './wiremock'
import { eligibilityFactory } from '../../server/testutils/factories'
import apiPaths from '../../server/paths/api'

export default {
  stubGetEligibilityByCrn: (crn: string, eligibilityData?: EligibilityDto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.eligibility.show({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: eligibilityData || eligibilityFactory.build(),
      },
    }),
  stubGetEligibilityByCrn500: (crn: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.eligibility.show({ crn }),
      },
      response: {
        status: 500,
      },
    }),
}
