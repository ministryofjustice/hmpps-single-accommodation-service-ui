import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import describeClient from '../testutils/describeClient'
import ProposedAddressesClient from './proposedAddressesClient'
import apiPaths from '../paths/api'
import crnFactory from '../testutils/crn'
import { accommodationFactory, proposedAddressFormFactory } from '../testutils/factories'

describeClient('ProposedAddressesClient', provider => {
  let proposedAddressesClient: ProposedAddressesClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>
  const token = 'test-user-token'

  beforeEach(() => {
    proposedAddressesClient = new ProposedAddressesClient(mockAuthenticationClient)
  })

  it('should make a GET request to /cases/:crn/proposed-accommodations', async () => {
    const crn = crnFactory()
    const proposedAddressesResponse = accommodationFactory.proposed().buildList(3)

    await provider.addInteraction({
      state: `Proposed addresses exist for case with CRN ${crn}`,
      uponReceiving: 'a request to get proposed addresses for a case by CRN',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.proposedAddresses.index({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body: proposedAddressesResponse,
      },
    })

    await proposedAddressesClient.getProposedAddresses(token, crn)
  })

  it('should make a POST request to /cases/:crn/proposed-accommodations', async () => {
    const crn = crnFactory()
    const proposedAddressData = proposedAddressFormFactory.manualAddress().build()

    await provider.addInteraction({
      state: `Proposed address can be submitted for case with CRN ${crn}`,
      uponReceiving: 'a request to submit a proposed address for a case by CRN',
      withRequest: {
        method: 'POST',
        path: apiPaths.cases.proposedAddresses.submit({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
        body: proposedAddressData,
      },
      willRespondWith: {
        status: 200,
      },
    })

    await proposedAddressesClient.submit(crn, proposedAddressData)
  })
})
