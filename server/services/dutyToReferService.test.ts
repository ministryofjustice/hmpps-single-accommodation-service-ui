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

  it('should call getAllDutyToRefer on the api client and return its result', async () => {
    const dutyToRefer = [dutyToReferFactory.build()]
    const crn = crnFactory()
    dutyToReferClient.getAllDutyToRefer.mockResolvedValue(dutyToRefer)

    const result = await dutyToReferService.getAllDutyToRefer(token, crn)

    expect(dutyToReferClient.getAllDutyToRefer).toHaveBeenCalledWith(token, crn)
    expect(result).toEqual(dutyToRefer)
  })
})
