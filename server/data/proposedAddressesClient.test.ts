import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { AccommodationDetailCommand } from '@sas/api'
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

  it('should make a GET request to /cases/:crn/proposed-accommodations/:id', async () => {
    const crn = crnFactory()
    const proposedAddress = accommodationFactory.proposed().build()

    await provider.addInteraction({
      state: `A proposed address exists for case with CRN ${crn}`,
      uponReceiving: 'a request to get a proposed address for a case by CRN and address ID',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.proposedAddresses.show({ crn, id: proposedAddress.id }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body: proposedAddress,
      },
    })

    await proposedAddressesClient.getProposedAddress(token, crn, proposedAddress.id)
  })

  it('should make a POST request to /cases/:crn/proposed-accommodations', async () => {
    const crn = crnFactory()
    const proposedAddressData = proposedAddressFormFactory.manualAddress().build()
    const proposedAddressDetail = {
      ...proposedAddressData,
      arrangementType: 'PRIVATE',
      nextAccommodationStatus: proposedAddressData.nextAccommodationStatus ?? 'TO_BE_DECIDED',
    } as AccommodationDetailCommand

    await provider.addInteraction({
      state: `Proposed address can be submitted for case with CRN ${crn}`,
      uponReceiving: 'a request to submit a proposed address for a case by CRN',
      withRequest: {
        method: 'POST',
        path: apiPaths.cases.proposedAddresses.submit({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
        body: proposedAddressDetail,
      },
      willRespondWith: {
        status: 200,
      },
    })

    await proposedAddressesClient.submit(token, crn, proposedAddressDetail)
  })

  it('should make a PUT request to /cases/:crn/proposed-accommodations/:id', async () => {
    const crn = crnFactory()
    const id = 'c1b1d9f8-6f3a-4b52-9c5c-6a0c5a9d8f1f'
    const proposedAddressData = proposedAddressFormFactory.manualAddress().build()

    const proposedAddressDetail = {
      ...proposedAddressData,
      nextAccommodationStatus: proposedAddressData.nextAccommodationStatus ?? 'TO_BE_DECIDED',
    } as AccommodationDetailCommand

    await provider.addInteraction({
      state: `Proposed address can be updated for case with CRN ${crn}`,
      uponReceiving: 'a request to update a proposed address for a case by CRN and address ID',
      withRequest: {
        method: 'PUT',
        path: apiPaths.cases.proposedAddresses.update({ crn, id }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
        body: proposedAddressDetail,
      },
      willRespondWith: {
        status: 200,
      },
    })

    await proposedAddressesClient.update(token, crn, id, proposedAddressDetail)
  })
})
