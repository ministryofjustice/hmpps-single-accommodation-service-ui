import { SubmitDutyToRefer, UpdateDutyToRefer } from '@sas/ui'
import { DutyToReferClient } from '../data'

export default class DutyToReferService {
  constructor(private readonly dutyToReferClient: DutyToReferClient) {}

  getAllDutyToRefer(token: string, crn: string) {
    return this.dutyToReferClient.getAllDutyToRefer(token, crn)
  }

  getDutyToRefer(token: string, crn: string) {
    return this.dutyToReferClient.getDutyToRefer(token, crn)
  }

  update(token: string, crn: string, id: string, dutyToReferData: UpdateDutyToRefer) {
    return this.dutyToReferClient.update(token, crn, id, dutyToReferData)
  }

  submit(token: string, crn: string, id: string, dutyToReferData: SubmitDutyToRefer) {
    return this.dutyToReferClient.submit(token, crn, id, dutyToReferData)
  }
}
