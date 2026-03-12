import { faker } from '@faker-js/faker'
import DutyToReferService from './dutyToReferService'
import DutyToReferClient from '../data/dutyToReferClient'
import { dtrCommandFactory, dutyToReferFactory } from '../testutils/factories'
import crnFactory from '../testutils/crn'

jest.mock('../data/dutyToReferClient')

describe('DutyToReferService', () => {
  const dutyToReferClient = new DutyToReferClient(null) as jest.Mocked<DutyToReferClient>
  let dutyToReferService: DutyToReferService

  const token = 'test-user-token'

  beforeEach(() => {
    dutyToReferService = new DutyToReferService(dutyToReferClient)
  })

  it('should call getDutyToRefer on the api client and return its result', async () => {
    const crn = crnFactory()
    const dutyToRefer = dutyToReferFactory.build({ crn })
    dutyToReferClient.getDutyToRefer.mockResolvedValue(dutyToRefer)

    const result = await dutyToReferService.getDutyToRefer(token, crn)

    expect(dutyToReferClient.getDutyToRefer).toHaveBeenCalledWith(token, crn)
    expect(result).toEqual(dutyToRefer)
  })

  it('should call update on the api client with dtr command data and return its result', async () => {
    const crn = crnFactory()
    const id = faker.string.uuid()
    const dutyToReferData = dtrCommandFactory.build()

    await dutyToReferService.update(token, crn, id, dutyToReferData)

    expect(dutyToReferClient.update).toHaveBeenCalledWith(token, crn, id, dutyToReferData)
  })

  it('should call submit on the api client with dtr command data and return its result', async () => {
    const crn = crnFactory()
    const dutyToReferData = dtrCommandFactory.build()

    await dutyToReferService.submit(token, crn, dutyToReferData)

    expect(dutyToReferClient.submit).toHaveBeenCalledWith(token, crn, dutyToReferData)
  })
})
