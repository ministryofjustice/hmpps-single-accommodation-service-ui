import { DtrCommand, NoteCommand } from '@sas/api'
import { DutyToReferClient } from '../data'

export default class DutyToReferService {
  constructor(private readonly dutyToReferClient: DutyToReferClient) {}

  getCurrentDtr(token: string, crn: string) {
    return this.dutyToReferClient.getCurrentDtr(token, crn)
  }

  getDtrBySubmissionId(token: string, crn: string, id: string) {
    return this.dutyToReferClient.getDtrBySubmissionId(token, crn, id)
  }

  update(token: string, crn: string, id: string, dutyToReferData: DtrCommand) {
    return this.dutyToReferClient.update(token, crn, id, dutyToReferData)
  }

  submit(token: string, crn: string, dutyToReferData: DtrCommand) {
    return this.dutyToReferClient.submit(token, crn, dutyToReferData)
  }

  async getTimeline(token: string, crn: string, id: string) {
    return this.dutyToReferClient.getTimeline(token, crn, id)
  }

  async submitTimelineNote(token: string, crn: string, id: string, note: NoteCommand) {
    return this.dutyToReferClient.submitTimelineNote(token, crn, id, note)
  }
}
