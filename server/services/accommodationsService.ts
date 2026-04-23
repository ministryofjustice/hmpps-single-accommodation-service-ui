import AccommodationsClient from '../data/accommodationsClient'

export default class AccommodationsService {
  constructor(private readonly accommodationsClient: AccommodationsClient) {}

  async getCurrentAccommodation(token: string, crn: string) {
    return this.accommodationsClient.getCurrentAccommodation(token, crn)
  }

  async getNextAccommodation(token: string, crn: string) {
    return this.accommodationsClient.getNextAccommodation(token, crn)
  }
}
