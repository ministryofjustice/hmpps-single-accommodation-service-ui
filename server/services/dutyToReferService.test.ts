import { faker } from '@faker-js/faker'
import DutyToReferService from './dutyToReferService'
import DutyToReferClient from '../data/dutyToReferClient'
import { apiResponseFactory, auditRecordFactory, dtrCommandFactory, dutyToReferFactory } from '../testutils/factories'
import crnFactory from '../testutils/crn'

jest.mock('../data/dutyToReferClient')

describe('DutyToReferService', () => {
  const dutyToReferClient = new DutyToReferClient(null) as jest.Mocked<DutyToReferClient>
  let dutyToReferService: DutyToReferService

  const token = 'test-user-token'
  const crn = crnFactory()
  const id = faker.string.uuid()

  beforeEach(() => {
    dutyToReferService = new DutyToReferService(dutyToReferClient)
  })

  it('should call getCurrentDtr on the api client and return its result', async () => {
    const dutyToRefer = dutyToReferFactory.build({ crn })
    const response = apiResponseFactory.dutyToRefer(dutyToRefer)
    dutyToReferClient.getCurrentDtr.mockResolvedValue(response)

    const result = await dutyToReferService.getCurrentDtr(token, crn)

    expect(dutyToReferClient.getCurrentDtr).toHaveBeenCalledWith(token, crn)
    expect(result).toEqual(response)
  })

  it('should call getDtrBySubmissionId on the api client and return its result', async () => {
    const dutyToRefer = dutyToReferFactory.submitted().build({ crn })
    const response = apiResponseFactory.dutyToRefer(dutyToRefer)
    dutyToReferClient.getDtrBySubmissionId.mockResolvedValue(response)

    const result = await dutyToReferService.getDtrBySubmissionId(token, crn, dutyToRefer.submission.id)

    expect(dutyToReferClient.getDtrBySubmissionId).toHaveBeenCalledWith(token, crn, dutyToRefer.submission.id)
    expect(result).toEqual(response)
  })

  it('should call update on the api client with dtr command data and return its result', async () => {
    const dutyToReferData = dtrCommandFactory.build()

    await dutyToReferService.update(token, crn, id, dutyToReferData)

    expect(dutyToReferClient.update).toHaveBeenCalledWith(token, crn, id, dutyToReferData)
  })

  it('should call submit on the api client with dtr command data and return its result', async () => {
    const dutyToReferData = dtrCommandFactory.build()

    await dutyToReferService.submit(token, crn, dutyToReferData)

    expect(dutyToReferClient.submit).toHaveBeenCalledWith(token, crn, dutyToReferData)
  })

  describe('getTimeline', () => {
    it('should call getTimeline on the api client and return the duty to refer timeline', async () => {
      const auditRecords = auditRecordFactory.buildList(3)

      dutyToReferClient.getTimeline.mockResolvedValue(auditRecords)

      const result = await dutyToReferService.getTimeline(token, crn, id)

      expect(dutyToReferClient.getTimeline).toHaveBeenCalledWith(token, crn, id)
      expect(result).toEqual(auditRecords)
    })
  })

  describe('submitTimelineNote', () => {
    it('should call submitTimelineNote on the api client with the note data', async () => {
      const note = 'This is a note\n\nWith multiple lines'

      await dutyToReferService.submitTimelineNote(token, crn, id, note)

      expect(dutyToReferClient.submitTimelineNote).toHaveBeenCalledWith(token, crn, id, note)
    })
  })
})
