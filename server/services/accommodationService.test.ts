import { apiResponseFactory } from '../testutils/factories'
import AccommodationClient from '../data/accommodationClient'
import AccommodationService from './accommodationService'

jest.mock('../data/accommodationClient')

describe('AccommodationService', () => {
  const accommodationClient = new AccommodationClient(null) as jest.Mocked<AccommodationClient>
  let accommodationService: AccommodationService

  const token = 'test-user-token'

  beforeEach(() => {
    accommodationService = new AccommodationService(accommodationClient)
  })

  it('should call getAccommodationHistory on the api client and return its result', async () => {
    const response = apiResponseFactory.accommodationHistory()

    accommodationClient.getAccommodationHistory.mockResolvedValue(response)

    const result = await accommodationService.getAccommodationHistory(token, 'X123456')

    expect(accommodationClient.getAccommodationHistory).toHaveBeenCalledWith(token, 'X123456')
    expect(result).toEqual(response)
  })

  it('should call getAccommodationSummary on the api client and return its result', async () => {
    const response = apiResponseFactory.accommodationSummaries()

    accommodationClient.getAccommodationSummary.mockResolvedValue(response)

    const result = await accommodationService.getAccommodationSummary(token, 'X123456')

    expect(accommodationClient.getAccommodationSummary).toHaveBeenCalledWith(token, 'X123456')
    expect(result).toEqual(response)
  })
})
