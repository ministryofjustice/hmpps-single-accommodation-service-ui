import OsDataHubService from './osDataHubService'
import OsDataHubClient from '../data/osDataHubClient'
import {
  filterResultsByNameOrNumber,
  OsDataHubResponse,
  OsDataHubResult,
  resultToAddressDetails,
} from '../utils/osDataHub'

jest.mock('../data/osDataHubClient')

describe('osDataHubService', () => {
  const osDataHubClient = new OsDataHubClient() as jest.Mocked<OsDataHubClient>
  let osDataHubService: OsDataHubService

  beforeEach(() => {
    osDataHubService = new OsDataHubService(osDataHubClient)
  })

  describe('getByNameOrNumberAndPostcode', () => {
    it('calls the OS Data Hub API with the correct parameters and returns filtered results', async () => {
      const apiResponse: OsDataHubResponse = {
        header: {},
        results: [
          { DPA: { ADDRESS: '199, M21 0BP', BUILDING_NUMBER: '199', UPRN: '001' } },
          { DPA: { ADDRESS: '23, M21 0BP', BUILDING_NUMBER: '23', BUILDING_NAME: 'NOPE', UPRN: '002' } },
          { DPA: { ADDRESS: '19A, M21 0BP', BUILDING_NAME: '19A', UPRN: '003' } },
          { DPA: { ADDRESS: '19, M21 0BP', BUILDING_NUMBER: '19', UPRN: '004' } },
        ] as OsDataHubResult[],
      }
      const expectedResult = filterResultsByNameOrNumber(apiResponse.results, '19').map(resultToAddressDetails)

      osDataHubClient.getByPostcode.mockResolvedValue(apiResponse)

      const addresses = await osDataHubService.getByNameOrNumberAndPostcode('19', 'M210BP')

      expect(osDataHubClient.getByPostcode).toHaveBeenCalledWith('M210BP')

      expect(addresses).toEqual(expectedResult)
    })
  })
})
