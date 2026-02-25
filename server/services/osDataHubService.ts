import { AccommodationAddressDetails } from '@sas/api'
import OsDataHubClient from '../data/osDataHubClient'
import { filterOsDataHubResultsByNameOrNumber, osDataHubResultToAddressDetails } from '../utils/proposedAddresses'

export default class OsDataHubService {
  constructor(private readonly osDataHubClient: OsDataHubClient) {}

  async getByNameOrNumberAndPostcode(nameOrNumber: string, postcode: string): Promise<AccommodationAddressDetails[]> {
    const { results } = await this.osDataHubClient.getByPostcode(postcode)

    return filterOsDataHubResultsByNameOrNumber(results, nameOrNumber).map(osDataHubResultToAddressDetails)
  }
}
