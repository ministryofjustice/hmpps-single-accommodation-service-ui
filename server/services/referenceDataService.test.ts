import ReferenceDataService from './referenceDataService'
import ReferenceDataClient from '../data/referenceDataClient'
import { apiResponseFactory } from '../testutils/factories'

jest.mock('../data/referenceDataClient')

describe('ReferenceDataService', () => {
  const referenceDataClient = new ReferenceDataClient(null) as jest.Mocked<ReferenceDataClient>
  const token = 'some token'
  let referenceDataService: ReferenceDataService

  beforeEach(() => {
    referenceDataService = new ReferenceDataService(referenceDataClient)
  })

  it('should call getLocalAuthorities on the api client and return its result', async () => {
    const response = apiResponseFactory.referenceData()
    referenceDataClient.getReferenceData.mockResolvedValue(response)

    const result = await referenceDataService.getLocalAuthorities(token)

    expect(referenceDataClient.getReferenceData).toHaveBeenCalledWith(token, 'LOCAL_AUTHORITY_AREAS')
    expect(result).toEqual(response)
  })

  it('should call getAccommodationTypes on the api client and return its result', async () => {
    const response = apiResponseFactory.referenceData()
    referenceDataClient.getReferenceData.mockResolvedValue(response)

    const result = await referenceDataService.getAccommodationTypes(token)

    expect(referenceDataClient.getReferenceData).toHaveBeenCalledWith(token, 'ACCOMMODATION_TYPES')
    expect(result).toEqual(response)
  })
})
