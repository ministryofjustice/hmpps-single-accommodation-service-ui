import AccommodationClient from '../data/accommodationClient'

export default class AccommodationService {
  constructor(private readonly accommodationClient: AccommodationClient) {}

  async getAccommodationHistory(token: string, crn: string) {
    return this.accommodationClient.getAccommodationHistory(token, crn)
  }

  async getAccommodationSummary(token: string, crn: string) {
    return this.accommodationClient.getAccommodationSummary(token, crn)
  }
}
