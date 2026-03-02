import { AccommodationAddressDetails } from '@sas/api'
import OsDataHubClient from '../data/osDataHubClient'
import { filterResultsByNameOrNumber, resultToAddressDetails } from '../utils/osDataHub'

export default class OsDataHubService {
  constructor(private readonly osDataHubClient: OsDataHubClient) {}

  async getByNameOrNumberAndPostcode(nameOrNumber: string, postcode: string): Promise<AccommodationAddressDetails[]> {
    const { results } = await this.osDataHubClient.getByPostcode(postcode)

    return filterResultsByNameOrNumber(results, nameOrNumber).map(resultToAddressDetails)
  }
}
