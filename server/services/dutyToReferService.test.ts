import DutyToReferService from './dutyToReferService'
import DutyToReferClient from '../data/dutyToReferClient'
import { dutyToReferFactory } from '../testutils/factories'
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
    const dutyToRefer = [dutyToReferFactory.build()]
    const crn = crnFactory()
    dutyToReferClient.getDutyToRefer.mockResolvedValue(dutyToRefer)

    const result = await dutyToReferService.getDutyToRefer(token, crn)

    expect(dutyToReferClient.getDutyToRefer).toHaveBeenCalledWith(token, crn)
    expect(result).toEqual(dutyToRefer)
  })
})
