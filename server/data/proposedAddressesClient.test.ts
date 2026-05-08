import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import describeClient from '../testutils/describeClient'
import ProposedAddressesClient from './proposedAddressesClient'
import apiPaths from '../paths/api'
import crnFactory from '../testutils/crn'
import {
  proposedAccommodationDetailCommandFactory,
  apiResponseFactory,
  proposedAccommodationFactory,
} from '../testutils/factories'

describeClient('ProposedAddressesClient', provider => {
  let proposedAddressesClient: ProposedAddressesClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>
  const token = 'test-user-token'

  beforeEach(() => {
    proposedAddressesClient = new ProposedAddressesClient(mockAuthenticationClient)
  })

  it('should make a GET request to /cases/:crn/proposed-accommodations', async () => {
    const crn = crnFactory()
    const body = apiResponseFactory.proposedAddresses()

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
        body,
      },
    })

    const response = await proposedAddressesClient.getProposedAddresses(token, crn)
    expect(response).toEqual(body)
  })

  it('should make a GET request to /cases/:crn/proposed-accommodations/:id', async () => {
    const body = apiResponseFactory.proposedAddress()
    const {
      data: { id, crn },
    } = body

    await provider.addInteraction({
      state: `A proposed address exists for case with CRN ${crn}`,
      uponReceiving: 'a request to get a proposed address for a case by CRN and address ID',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.proposedAddresses.show({ crn, id }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await proposedAddressesClient.getProposedAddress(token, crn, id)
    expect(response).toEqual(body)
  })

  it('should make a POST request to /cases/:crn/proposed-accommodations', async () => {
    const crn = crnFactory()
    const proposedAddressData = proposedAccommodationDetailCommandFactory.build()

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
        status: 201,
      },
    })

    await proposedAddressesClient.submit(token, crn, proposedAddressData)
  })

  it('should make a PUT request to /cases/:crn/proposed-accommodations/:id', async () => {
    const crn = crnFactory()
    const id = 'c1b1d9f8-6f3a-4b52-9c5c-6a0c5a9d8f1f'
    const proposedAddressData = proposedAccommodationDetailCommandFactory.build()

    await provider.addInteraction({
      state: `Proposed address can be updated for case with CRN ${crn}`,
      uponReceiving: 'a request to update a proposed address for a case by CRN and address ID',
      withRequest: {
        method: 'PUT',
        path: apiPaths.cases.proposedAddresses.update({ crn, id }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
        body: proposedAddressData,
      },
      willRespondWith: {
        status: 200,
      },
    })

    await proposedAddressesClient.update(token, crn, id, proposedAddressData)
  })

  it('should make a GET request to /cases/:crn/proposed-accommodations/:id/timeline', async () => {
    const body = apiResponseFactory.auditRecords()
    const { id, crn } = proposedAccommodationFactory.build()

    await provider.addInteraction({
      state: `A proposed address timeline exists for case with CRN ${crn}`,
      uponReceiving: 'a request to get a proposed address timeline for a case by CRN and address ID',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.proposedAddresses.timeline({ crn, id }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await proposedAddressesClient.getTimeline(token, crn, id)
    expect(response).toEqual(body)
  })

  it('should make a POST request to /cases/:crn/proposed-accommodations/:id/notes', async () => {
    const crn = crnFactory()
    const proposedAddress = proposedAccommodationFactory.build()
    const note = { note: 'This is a note\n\nWith multiple lines' }

    await provider.addInteraction({
      state: `A proposed address timeline exists for case with CRN ${crn}`,
      uponReceiving: 'a request to post a proposed address timeline note for a case by CRN and address ID',
      withRequest: {
        method: 'POST',
        path: apiPaths.cases.proposedAddresses.notes({ crn, id: proposedAddress.id }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
        body: note,
      },
      willRespondWith: {
        status: 201,
      },
    })

    await proposedAddressesClient.submitTimelineNote(token, crn, proposedAddress.id, note)
  })
})
