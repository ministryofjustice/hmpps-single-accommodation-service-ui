import { faker } from '@faker-js/faker'
import DutyToReferService from './dutyToReferService'
import DutyToReferClient from '../data/dutyToReferClient'
import { accommodationFactory, apiResponseFactory, dtrCommandFactory, dutyToReferFactory } from '../testutils/factories'
import crnFactory from '../testutils/crn'
import AccommodationsClient from '../data/accommodationsClient'
import AccommodationsService from './accommodationsService'

jest.mock('../data/accommodationsClient')

describe('AccommodationsService', () => {
  const accommodationsClient = new AccommodationsClient(null) as jest.Mocked<AccommodationsClient>
  let accommodationsService: AccommodationsService

  const token = 'test-user-token'

  beforeEach(() => {
    accommodationsService = new AccommodationsService(accommodationsClient)
  })

  it('should call getCurrentAccommodation on the api client and return its result', async () => {
    const crn = crnFactory()
    const accommodation = accommodationFactory.build({ crn })
    const response = apiResponseFactory.accommodationSummary(accommodation)
    accommodationsClient.getCurrentAccommodation.mockResolvedValue(response)

    const result = await accommodationsService.getCurrentAccommodation(token, crn)

    expect(accommodationsClient.getCurrentAccommodation).toHaveBeenCalledWith(token, crn)
    expect(result).toEqual(response)
  })

  it('should call getNextAccommodation on the api client and return its result', async () => {
    const crn = crnFactory()
    const accommodation = accommodationFactory.build({ crn })
    const response = apiResponseFactory.accommodationSummary(accommodation)
    accommodationsClient.getNextAccommodation.mockResolvedValue(response)

    const result = await accommodationsService.getNextAccommodation(token, crn)

    expect(accommodationsClient.getNextAccommodation).toHaveBeenCalledWith(token, crn)
    expect(result).toEqual(response)
  })
})
