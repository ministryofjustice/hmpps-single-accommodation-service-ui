import ProposedAddressesClient from '../data/proposedAddressesClient'
import { accommodationFactory, auditRecordFactory, proposedAddressFormFactory } from '../testutils/factories'
import ProposedAddressesService from './proposedAddressesService'
import { formDataToRequestBody } from '../utils/proposedAddresses'

jest.mock('../data/proposedAddressesClient')

describe('ProposedAddressesService', () => {
  const proposedAddressesClient = new ProposedAddressesClient(null) as jest.Mocked<ProposedAddressesClient>
  let proposedAddressesService: ProposedAddressesService

  const token = 'test-user-token'
  const crn = 'X123456'
  const id = 'some-id'

  beforeEach(() => {
    proposedAddressesService = new ProposedAddressesService(proposedAddressesClient)
  })

  describe('getProposedAddresses', () => {
    it('should call getProposedAddresses on the api client and return sorted addresses', async () => {
      const passedChecksAddress = accommodationFactory
        .proposed()
        .build({ verificationStatus: 'PASSED', nextAccommodationStatus: 'NO' })
      const confirmedAddress = accommodationFactory
        .proposed()
        .build({ verificationStatus: 'PASSED', nextAccommodationStatus: 'YES' })
      const notCheckedAddress = accommodationFactory.proposed().build({ verificationStatus: 'NOT_CHECKED_YET' })
      const failedChecksAddress = accommodationFactory.proposed().build({ verificationStatus: 'FAILED' })

      proposedAddressesClient.getProposedAddresses.mockResolvedValue([
        passedChecksAddress,
        failedChecksAddress,
        notCheckedAddress,
        confirmedAddress,
      ])

      const result = await proposedAddressesService.getProposedAddresses(token, crn)

      expect(proposedAddressesClient.getProposedAddresses).toHaveBeenCalledWith(token, crn)
      expect(result).toEqual({
        proposed: [passedChecksAddress, notCheckedAddress, confirmedAddress],
        failedChecks: [failedChecksAddress],
      })
    })
  })

  describe('getProposedAddress', () => {
    it('should call getProposedAddress on the api client and return the proposed address', async () => {
      const proposedAddress = accommodationFactory.proposed().build({ id })

      proposedAddressesClient.getProposedAddress.mockResolvedValue(proposedAddress)

      const result = await proposedAddressesService.getProposedAddress(token, crn, id)

      expect(proposedAddressesClient.getProposedAddress).toHaveBeenCalledWith(token, crn, id)
      expect(result).toEqual(proposedAddress)
    })
  })

  describe('submit', () => {
    it('should call submit on the API client with the proposed address data', async () => {
      const proposedAddressData = proposedAddressFormFactory.build()

      await proposedAddressesService.submit(token, crn, proposedAddressData)

      const expectedData = formDataToRequestBody(proposedAddressData)

      expect(proposedAddressesClient.submit).toHaveBeenCalledWith(token, crn, expectedData)
    })
  })

  describe('update', () => {
    it('should call update on the api client with the proposed address data', async () => {
      const proposedAddressData = proposedAddressFormFactory.manualAddress().build({ id })

      await proposedAddressesService.update(token, crn, proposedAddressData)

      const expectedData = formDataToRequestBody(proposedAddressData)

      expect(proposedAddressesClient.update).toHaveBeenCalledWith(token, crn, id, expectedData)
    })
  })

  describe('getTimeline', () => {
    it('should call getTimeline on the api client and return the proposed address timeline', async () => {
      const auditRecords = auditRecordFactory.buildList(3)

      proposedAddressesClient.getTimeline.mockResolvedValue(auditRecords)

      const result = await proposedAddressesService.getTimeline(token, crn, id)

      expect(proposedAddressesClient.getTimeline).toHaveBeenCalledWith(token, crn, id)
      expect(result).toEqual(auditRecords)
    })
  })

  describe('submitTimelineNote', () => {
    it('should call submitTimelineNote on the api client with the note data', async () => {
      const note = { note: 'This is a note\n\nWith multiple lines' }

      await proposedAddressesService.submitTimelineNote(token, crn, id, note)

      expect(proposedAddressesClient.submitTimelineNote).toHaveBeenCalledWith(token, crn, id, note)
    })
  })
})
