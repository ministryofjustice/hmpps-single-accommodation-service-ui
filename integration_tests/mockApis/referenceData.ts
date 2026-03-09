import { SuperAgentRequest } from 'superagent'
import { ReferenceDataDto } from '@sas/api'
import { stubFor } from './wiremock'
import localAuthoritiesJson from '../../wiremock/fixtures/referenceData/localAuthorities.json'

export default {
  stubGetLocalAuthorities: (localAuthorities?: ReferenceDataDto[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPathPattern: '/reference-data',
        queryParameters: {
          type: {
            equalTo: 'LOCAL_AUTHORITY_AREAS',
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: localAuthorities || localAuthoritiesJson,
      },
    }),
}
