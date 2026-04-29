import AccommodationClient from '../data/accommodationClient'

export default class AccommodationService {
  constructor(private readonly accommodationClient: AccommodationClient) {}

  async getCurrentAccommodation(token: string, crn: string) {
    return this.accommodationClient.getCurrentAccommodation(token, crn)
  }

  async getNextAccommodation(token: string, crn: string) {
    return this.accommodationClient.getNextAccommodation(token, crn)
  }

  async getAccommodationHistory(token: string, crn: string) {
    return this.accommodationClient.getAccommodationHistory(token, crn)
  }
}
