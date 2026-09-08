import { AccommodationAddressDetails } from '@sas/api'
import OsDataHubClient from '../data/osDataHubClient'
import { filterResultsByNameOrNumber, resultToAddressDetails } from '../utils/osDataHub'

export default class OsDataHubService {
  constructor(private readonly osDataHubClient: OsDataHubClient) {}

  async getByNameOrNumberAndPostcode(
    nameOrNumber: string,
    postcode: string,
  ): Promise<{ addresses: AccommodationAddressDetails[]; exactMatch: boolean }> {
    const { results = [] } = await this.osDataHubClient.getByPostcode(postcode)

    const filteredResults = filterResultsByNameOrNumber(results, nameOrNumber)
    const exactMatch = filteredResults.length > 0
    const matchedResults = exactMatch ? filteredResults : results

    return { addresses: matchedResults.map(resultToAddressDetails), exactMatch }
  }
}
