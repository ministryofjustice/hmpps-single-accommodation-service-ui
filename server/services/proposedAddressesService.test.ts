import ProposedAddressesClient from '../data/proposedAddressesClient'
import { accommodationFactory, proposedAddressFactory } from '../testutils/factories'
import ProposedAddressesService from './proposedAddressesService'

jest.mock('../data/proposedAddressesClient')

describe('ProposedAddressesService', () => {
  const proposedAddressesClient = new ProposedAddressesClient(null) as jest.Mocked<ProposedAddressesClient>
  let proposedAddressesService: ProposedAddressesService

  const token = 'test-user-token'
  const crn = 'X123456'

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

  describe('submit', () => {
    it('should call submit on the api client', async () => {
      const proposedAddressData = proposedAddressFactory.build()

      const result = await proposedAddressesService.submit(token, crn, proposedAddressData)

      expect(proposedAddressesClient.submit).toHaveBeenCalledWith(crn, proposedAddressData)
      expect(result).toEqual(undefined)
    })
  })
})
