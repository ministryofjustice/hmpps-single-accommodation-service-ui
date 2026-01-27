import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { DutyToReferDto } from '@sas/api'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class DutyToReferClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Duty to Refer client', config.apis.sasApi, logger, authenticationClient)
  }

  getDutyToRefer(token: string, crn: string) {
    return this.get<DutyToReferDto[]>({ path: apiPaths.cases.dutyToRefer({ crn }) }, asUser(token))
  }
}
