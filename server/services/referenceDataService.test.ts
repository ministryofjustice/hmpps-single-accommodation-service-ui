import ReferenceDataService from './referenceDataService'
import ReferenceDataClient from '../data/referenceDataClient'
import { referenceDataFactory } from '../testutils/factories'

jest.mock('../data/referenceDataClient')

describe('ReferenceDataService', () => {
  const referenceDataClient = new ReferenceDataClient(null) as jest.Mocked<ReferenceDataClient>
  let referenceDataService: ReferenceDataService

  beforeEach(() => {
    referenceDataService = new ReferenceDataService(referenceDataClient)
  })

  it('should call getLocalAuthorities on the api client and return its result', async () => {
    const referenceData = referenceDataFactory.buildList(3)
    referenceDataClient.getReferenceData.mockResolvedValue(referenceData)

    const result = await referenceDataService.getLocalAuthorities()

    expect(referenceDataClient.getReferenceData).toHaveBeenCalledWith('LOCAL_AUTHORITY_AREAS')
    expect(result).toEqual(referenceData)
  })
})
