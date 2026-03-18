import type { SuperAgentRequest } from 'superagent'
import { AccommodationDetail, AuditRecordDto } from '@sas/api'
import { stubApiError, stubFor } from './wiremock'
import apiPaths from '../../server/paths/api'
import { auditRecordFactory } from '../../server/testutils/factories'

export default {
  stubGetProposedAddressesByCrn: (crn: string, proposedAddresses?: AccommodationDetail[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.proposedAddresses.index({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: proposedAddresses || [],
      },
    }),
  stubGetProposedAddress: (crn: string, id: string, proposedAddress: AccommodationDetail): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.proposedAddresses.show({ crn, id }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: proposedAddress,
      },
    }),
  stubUpdateProposedAddress: (crn: string, id: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'PUT',
        urlPattern: apiPaths.cases.proposedAddresses.update({ crn, id }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),
  stubSubmitProposedAddress: (crn: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.cases.proposedAddresses.submit({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),
  stubSubmitProposedAddress500: (crn: string): SuperAgentRequest =>
    stubApiError(apiPaths.cases.proposedAddresses.submit({ crn }), 'POST'),
  stubGetProposedAddressTimeline: (crn: string, id: string, records?: AuditRecordDto[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.proposedAddresses.timeline({ crn, id }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: records || auditRecordFactory.proposedAddressCreated().buildList(1),
      },
    }),
}
