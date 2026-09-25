import OtherReferralsService from './otherReferralsService'
import OtherReferralsClient from '../data/otherReferralsClient'
import {
  apiResponseFactory,
  otherAccommodationReferralCommandFactory,
  otherAccommodationReferralFactory,
} from '../testutils/factories'
import crnFactory from '../testutils/crn'

jest.mock('../data/otherReferralsClient')

describe('OtherReferralsService', () => {
  const client = new OtherReferralsClient(null) as jest.Mocked<OtherReferralsClient>
  let service: OtherReferralsService

  const token = 'test-user-token'
  const crn = crnFactory()
  const id = '1234'

  beforeEach(() => {
    service = new OtherReferralsService(client)
  })

  it('should call getOtherReferralBySubmissionId on the api client and return the result', async () => {
    const otherReferral = otherAccommodationReferralFactory.submitted().build({ crn })
    const response = apiResponseFactory.otherReferral(otherReferral)
    client.getOtherReferralBySubmissionId.mockResolvedValue(response)

    const result = await service.getOtherReferralBySubmissionId(token, crn, otherReferral.submission.id)

    expect(client.getOtherReferralBySubmissionId).toHaveBeenCalledWith(token, crn, otherReferral.submission.id)
    expect(result).toEqual(response)
  })

  it('should call submit on the api client with otherReferral command', async () => {
    const command = otherAccommodationReferralCommandFactory.build()
    const otherReferral = otherAccommodationReferralFactory.submitted().build({ crn })
    client.submit.mockResolvedValue(otherReferral)

    const result = await service.submit(token, crn, command)

    expect(client.submit).toHaveBeenCalledWith(token, crn, command)
    expect(result).toEqual(otherReferral)
  })

  it('should call update on the api client with otherReferral command', async () => {
    const command = otherAccommodationReferralCommandFactory.build()

    await service.update(token, crn, id, command)

    expect(client.update).toHaveBeenCalledWith(token, crn, id, command)
  })
})
