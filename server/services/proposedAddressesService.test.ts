import { AccommodationDetailCommand } from '@sas/api'
import ProposedAddressesClient from '../data/proposedAddressesClient'
import { accommodationFactory, proposedAddressFormFactory } from '../testutils/factories'
import ProposedAddressesService from './proposedAddressesService'

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
    it.each([
      ['YES', 'YES'],
      ['NO', 'NO'],
      ['TO_BE_DECIDED', 'TO_BE_DECIDED'],
      [undefined, 'TO_BE_DECIDED'],
    ] as const)(
      'should call submit when input is %s with nextAccommodationStatus as %s',
      async (formValue, expectedStatus) => {
        const proposedAddressData = proposedAddressFormFactory.build({
          nextAccommodationStatus: formValue,
        })

        await proposedAddressesService.submit(token, crn, proposedAddressData)

        const expectedData: AccommodationDetailCommand = {
          ...proposedAddressData,
          arrangementType: 'PRIVATE',
          nextAccommodationStatus: expectedStatus,
        }

        expect(proposedAddressesClient.submit).toHaveBeenCalledWith(token, crn, expectedData)
      },
    )
  })

  describe('update', () => {
    it('should call update on the api client with the proposed address data', async () => {
      const proposedAddressData = proposedAddressFormFactory.manualAddress().build({ id })

      await proposedAddressesService.update(token, crn, proposedAddressData)

      const expectedData: AccommodationDetailCommand = {
        ...proposedAddressData,
        nextAccommodationStatus: proposedAddressData.nextAccommodationStatus ?? 'TO_BE_DECIDED',
      }

      expect(proposedAddressesClient.update).toHaveBeenCalledWith(token, crn, id, expectedData)
    })
  })
})
