import EligibilityService from './eligibilityService'
import EligibilityClient from '../data/eligibilityClient'
import { apiResponseFactory } from '../testutils/factories'
import crnFactory from '../testutils/crn'

jest.mock('../data/eligibilityClient')

describe('EligibilityService', () => {
  const eligibilityClient = new EligibilityClient(null) as jest.Mocked<EligibilityClient>
  let eligibilityService: EligibilityService

  const token = 'test-user-token'

  beforeEach(() => {
    eligibilityService = new EligibilityService(eligibilityClient)
  })

  it('should call getEligibility on the api client and return its result', async () => {
    const response = apiResponseFactory.eligibility()
    const crn = crnFactory()
    eligibilityClient.getEligibility.mockResolvedValue(response)

    const result = await eligibilityService.getEligibility(token, crn)

    expect(eligibilityClient.getEligibility).toHaveBeenCalledWith(token, crn)
    expect(result).toEqual(response)
  })
})
