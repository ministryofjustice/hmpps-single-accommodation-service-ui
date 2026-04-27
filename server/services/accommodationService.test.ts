import { accommodationFactory, apiResponseFactory } from '../testutils/factories'
import crnFactory from '../testutils/crn'
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

  it('should call getCurrentAccommodation on the api client and return its result', async () => {
    const crn = crnFactory()
    const accommodation = accommodationFactory.build({ crn })
    const response = apiResponseFactory.accommodationSummary(accommodation)
    accommodationClient.getCurrentAccommodation.mockResolvedValue(response)

    const result = await accommodationService.getCurrentAccommodation(token, crn)

    expect(accommodationClient.getCurrentAccommodation).toHaveBeenCalledWith(token, crn)
    expect(result).toEqual(response)
  })

  it('should call getNextAccommodation on the api client and return its result', async () => {
    const crn = crnFactory()
    const accommodation = accommodationFactory.build({ crn })
    const response = apiResponseFactory.accommodationSummary(accommodation)
    accommodationClient.getNextAccommodation.mockResolvedValue(response)

    const result = await accommodationService.getNextAccommodation(token, crn)

    expect(accommodationClient.getNextAccommodation).toHaveBeenCalledWith(token, crn)
    expect(result).toEqual(response)
  })

  it('should call getAccommodationHistory on the api client and return its result', async () => {
    const response = apiResponseFactory.accommodationHistory()

    accommodationClient.getAccommodationHistory.mockResolvedValue(response)

    const result = await accommodationService.getAccommodationHistory(token, 'X123456')

    expect(accommodationClient.getAccommodationHistory).toHaveBeenCalledWith(token, 'X123456')
    expect(result).toEqual(response)
  })
})
