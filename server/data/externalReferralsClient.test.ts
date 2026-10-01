import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { faker } from '@faker-js/faker/locale/en'
import describeClient from '../testutils/describeClient'
import ExternalReferralsClient from './externalReferralsClient'
import { apiResponseFactory, externalReferralCommandFactory, externalReferralFactory } from '../testutils/factories'
import apiPaths from '../paths/api'
import crnFactory from '../testutils/crn'

describeClient('ExternalReferralsClient', provider => {
  let client: ExternalReferralsClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    client = new ExternalReferralsClient(mockAuthenticationClient)
  })

  it('search - should make a get request to /cases/{crn}/external-accommodation-referral/search and return response', async () => {
    const referrals = externalReferralFactory.submitted().buildList(2)
    const body = apiResponseFactory.externalReferrals(referrals)
    const crn = crnFactory()

    await provider.addInteraction({
      state: `external referrals exist with`,
      uponReceiving: 'a request to get all external referrals for a crn',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.externalReferrals.search({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })
    const response = await client.search('test-user-token', crn)
    expect(response).toEqual(body)
  })

  it('should make a GET request to /cases/{crn}/other-accommodation-referral/{id} and return the response body', async () => {
    const referral = externalReferralFactory.submitted().build()
    const body = apiResponseFactory.externalReferral(referral)
    const {
      data: {
        crn,
        submission: { id },
      },
    } = body

    await provider.addInteraction({
      state: `external referral exists with id:${id}`,
      uponReceiving: 'a request to get an external referral by id',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.externalReferrals.show({ crn, id }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await client.getExternalReferralBySubmissionId('test-user-token', crn, id)
    expect(response).toEqual(body)
  })

  it('should make a POST request to external-referrals/submit with data', async () => {
    const crn = crnFactory()
    const command = externalReferralCommandFactory.build()

    await provider.addInteraction({
      state: `External referral can be submitted for case with CRN ${crn}`,
      uponReceiving: 'a request to submit an External Referral for a user case by CRN',
      withRequest: {
        method: 'POST',
        path: apiPaths.cases.externalReferrals.submit({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
        body: command,
      },
      willRespondWith: {
        status: 201,
        body: {},
      },
    })

    const response = await client.submit('test-user-token', crn, command)
    expect(response).toEqual({})
  })

  it('should make a PUT request to external-referrals/submit with data', async () => {
    const crn = crnFactory()
    const id = faker.string.uuid()
    const command = externalReferralCommandFactory.build()

    await provider.addInteraction({
      state: `External referral can be submitted for case with CRN ${crn}`,
      uponReceiving: 'a request to submit an External Referral for a user case by CRN',
      withRequest: {
        method: 'PUT',
        path: apiPaths.cases.externalReferrals.update({ crn, id }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
        body: command,
      },
      willRespondWith: {
        status: 200,
        body: {},
      },
    })

    const response = await client.update('test-user-token', crn, id, command)
    expect(response).toEqual({})
  })
})
