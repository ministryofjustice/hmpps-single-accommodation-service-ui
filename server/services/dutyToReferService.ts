import { DutyToReferClient } from '../data'

export default class DutyToReferService {
  constructor(private readonly dutyToReferClient: DutyToReferClient) {}

  getDutyToRefer(token: string, crn: string) {
    return this.dutyToReferClient.getDutyToRefer(token, crn)
  }
}
