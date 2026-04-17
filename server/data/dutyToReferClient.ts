import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { DtrCommand, ApiResponseDtoDutyToReferDto, AuditRecordDto } from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class DutyToReferClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Duty to Refer client', config.apis.sasApi, logger, authenticationClient)
  }

  getCurrentDtr(token: string, crn: string) {
    return this.get<ApiResponseDtoDutyToReferDto>({ path: apiPaths.cases.dutyToRefer.current({ crn }) }, asUser(token))
  }

  getDtrBySubmissionId(token: string, crn: string, id: string) {
    return this.get<ApiResponseDtoDutyToReferDto>({ path: apiPaths.cases.dutyToRefer.show({ crn, id }) }, asUser(token))
  }

  submit(token: string, crn: string, dutyToRefer: DtrCommand) {
    return this.post<void>(
      {
        path: apiPaths.cases.dutyToRefer.submit({ crn }),
        data: dutyToRefer,
      },
      asUser(token),
    )
  }

  update(token: string, crn: string, id: string, dutyToRefer: DtrCommand) {
    return this.put<void>(
      {
        path: apiPaths.cases.dutyToRefer.update({ crn, id }),
        data: dutyToRefer,
      },
      asUser(token),
    )
  }

  async getTimeline(token: string, crn: string, id: string) {
    return this.get<AuditRecordDto[]>({ path: apiPaths.cases.dutyToRefer.timeline({ crn, id }) }, asUser(token))
  }

  async submitTimelineNote(token: string, crn: string, id: string, note: string) {
    return this.post<void>(
      {
        path: apiPaths.cases.dutyToRefer.notes({ crn, id }),
        data: { note },
      },
      asUser(token),
    )
  }
}
