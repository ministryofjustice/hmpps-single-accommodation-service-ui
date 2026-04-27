import type { SuperAgentRequest } from 'superagent'
import { AuditRecordDto, DutyToReferDto } from '@sas/api'
import { stubFor, stubApiError } from './wiremock'
import {
  apiResponseFactory,
  auditRecordFactory,
  dutyToReferFactory,
  dtrSubmissionFactory,
} from '../../server/testutils/factories'
import apiPaths from '../../server/paths/api'

export default {
  stubGetCurrentDtr: (crn: string, dutyToReferData?: DutyToReferDto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.dutyToRefer.current({ crn }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.dutyToRefer(dutyToReferData),
      },
    }),
  stubGetCurrentDtr500: (crn: string): SuperAgentRequest => stubApiError(apiPaths.cases.dutyToRefer.current({ crn })),
  stubGetDtrBySubmissionId: (crn: string, submissionId: string, dutyToReferData?: DutyToReferDto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.dutyToRefer.show({ crn, id: submissionId }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.dutyToRefer(dutyToReferData || dutyToReferFactory.submitted().build()),
      },
    }),
  stubSubmitDutyToRefer: (crn: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.cases.dutyToRefer.submit({ crn }),
      },
      response: {
        status: 201,
      },
    }),
  stubUpdateDutyToRefer: (crn: string, id: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'PUT',
        urlPattern: apiPaths.cases.dutyToRefer.update({ crn, id }),
      },
      response: {
        status: 200,
      },
    }),
  stubGetDutyToReferTimeline: (crn: string, id: string, records?: AuditRecordDto[]): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: apiPaths.cases.dutyToRefer.timeline({ crn, id }),
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: apiResponseFactory.auditRecords(
          records || auditRecordFactory.dutyToReferSubmissionAdded(dtrSubmissionFactory.build()).buildList(1),
        ),
      },
    }),
  stubSubmitDutyToReferTimelineNote: (crn: string, id: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.cases.dutyToRefer.notes({ crn, id }),
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),
}
