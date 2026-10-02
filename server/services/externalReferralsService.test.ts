import ExternalReferralsService from './externalReferralsService'
import ExternalReferralsClient from '../data/externalReferralsClient'
import {
  apiResponseFactory,
  auditRecordFactory,
  externalReferralCommandFactory,
  externalReferralFactory,
} from '../testutils/factories'
import crnFactory from '../testutils/crn'

jest.mock('../data/externalReferralsClient')

describe('ExternalReferralsService', () => {
  const client = new ExternalReferralsClient(null) as jest.Mocked<ExternalReferralsClient>
  let service: ExternalReferralsService

  const token = 'test-user-token'
  const crn = crnFactory()
  const id = '1234'

  beforeEach(() => {
    service = new ExternalReferralsService(client)
  })

  it('should call getExternalReferralBySubmissionId on the api client and return the result', async () => {
    const externalReferral = externalReferralFactory.submitted().build({ crn })
    const response = apiResponseFactory.externalReferral(externalReferral)
    client.getExternalReferralBySubmissionId.mockResolvedValue(response)

    const result = await service.getExternalReferralBySubmissionId(token, crn, externalReferral.submission.id)

    expect(client.getExternalReferralBySubmissionId).toHaveBeenCalledWith(token, crn, externalReferral.submission.id)
    expect(result).toEqual(response)
  })

  it('should call submit on the api client with externalReferral command', async () => {
    const command = externalReferralCommandFactory.build()
    const externalReferral = externalReferralFactory.submitted().build({ crn })
    client.submit.mockResolvedValue(externalReferral)

    const result = await service.submit(token, crn, command)

    expect(client.submit).toHaveBeenCalledWith(token, crn, command)
    expect(result).toEqual(externalReferral)
  })

  it('should call update on the api client with externalReferral command', async () => {
    const command = externalReferralCommandFactory.build()

    await service.update(token, crn, id, command)

    expect(client.update).toHaveBeenCalledWith(token, crn, id, command)
  })

  it('should call getTimeline on the api client and return the result', async () => {
    const timeline = auditRecordFactory.buildList(2)
    const response = apiResponseFactory.auditRecords(timeline)
    client.getTimeline.mockResolvedValue(response)

    const result = await service.getTimeline(token, crn, id)

    expect(client.getTimeline).toHaveBeenCalledWith(token, crn, id)
    expect(result).toEqual(response)
  })
})
