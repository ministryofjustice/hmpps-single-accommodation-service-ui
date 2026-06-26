import type { Response, SuperAgentRequest } from 'superagent'
import { AuditRecordDto, DutyToReferDto } from '@sas/api'
import { stubFor } from './wiremock'
import {
  apiResponseFactory,
  auditRecordFactory,
  dutyToReferFactory,
  dtrSubmissionFactory,
} from '../../server/testutils/factories'
import apiPaths from '../../server/paths/api'

export default {
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
  stubGetDtrBySubmissionIdForEdit: (
    crn: string,
    submissionId: string,
    original: DutyToReferDto,
    updated: DutyToReferDto,
  ): Promise<Array<Response>> => {
    return Promise.all([
      stubFor({
        scenarioName: `dtr-${submissionId}`,
        requiredScenarioState: 'Started',
        newScenarioState: 'edited',
        priority: 1,
        request: { method: 'GET', urlPattern: apiPaths.cases.dutyToRefer.show({ crn, id: submissionId }) },
        response: {
          status: 200,
          headers: { 'Content-Type': 'application/json;charset=UTF-8' },
          jsonBody: apiResponseFactory.dutyToRefer(original),
        },
      }),
      stubFor({
        scenarioName: `dtr-${submissionId}`,
        requiredScenarioState: 'edited',
        priority: 1,
        request: { method: 'GET', urlPattern: apiPaths.cases.dutyToRefer.show({ crn, id: submissionId }) },
        response: {
          status: 200,
          headers: { 'Content-Type': 'application/json;charset=UTF-8' },
          jsonBody: apiResponseFactory.dutyToRefer(updated),
        },
      }),
    ])
  },
  stubSubmitDutyToRefer: (crn: string, dutyToReferData?: DutyToReferDto): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: apiPaths.cases.dutyToRefer.submit({ crn }),
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: dutyToReferData || dutyToReferFactory.submitted().build(),
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
          records || auditRecordFactory.dutyToReferAdded(dtrSubmissionFactory.build()).buildList(1),
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
