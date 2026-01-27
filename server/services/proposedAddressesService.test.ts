import ProposedAddressesClient from '../data/proposedAddressesClient'
import { proposedAddressFactory } from '../testutils/factories'
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

  describe('submit', () => {
    it('should call submit on the api client', async () => {
      const proposedAddressData = proposedAddressFactory.build()

      const result = await proposedAddressesService.submit(token, crn, proposedAddressData)

      expect(proposedAddressesClient.submit).toHaveBeenCalledWith(crn, proposedAddressData)
      expect(result).toEqual(undefined)
    })
  })
})
