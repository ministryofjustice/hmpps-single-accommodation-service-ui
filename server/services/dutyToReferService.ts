import { DtrCommand } from '@sas/api'
import { DutyToReferClient } from '../data'

export default class DutyToReferService {
  constructor(private readonly dutyToReferClient: DutyToReferClient) {}

  getDutyToRefer(token: string, crn: string) {
    return this.dutyToReferClient.getDutyToRefer(token, crn)
  }

  update(token: string, crn: string, id: string, dutyToReferData: DtrCommand) {
    return this.dutyToReferClient.update(token, crn, id, dutyToReferData)
  }

  submit(token: string, crn: string, dutyToReferData: DtrCommand) {
    return this.dutyToReferClient.submit(token, crn, dutyToReferData)
  }
}
