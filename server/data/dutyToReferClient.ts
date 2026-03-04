import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { DutyToReferDto, DtrCommand } from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class DutyToReferClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Duty to Refer client', config.apis.sasApi, logger, authenticationClient)
  }

  getAllDutyToRefer(token: string, crn: string) {
    return this.get<DutyToReferDto[]>({ path: apiPaths.cases.dutyToRefer.index({ crn }) }, asUser(token))
  }

  getDutyToRefer(token: string, crn: string) {
    return this.get<DutyToReferDto>({ path: apiPaths.cases.dutyToRefer.show({ crn }) }, asUser(token))
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
}
