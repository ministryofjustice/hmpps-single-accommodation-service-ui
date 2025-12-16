import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import CasesClient from './casesClient'
import describeClient from '../testutils/describeClient'
import { caseFactory, referralFactory } from '../testutils/factories'
import crnFactory from '../testutils/crn'

describeClient('CasesClient', provider => {
  let casesClient: CasesClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    casesClient = new CasesClient(mockAuthenticationClient)
  })

  it('should make a GET request to /cases using user token and return the response body', async () => {
    const cases = caseFactory.buildList(5)

    await provider.addInteraction({
      state: 'Cases exist for user',
      uponReceiving: 'a request to get user cases',
      withRequest: {
        method: 'GET',
        path: '/cases',
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body: cases,
      },
    })

    const response = await casesClient.getCases('test-user-token')
    expect(response).toEqual(cases)
  })

  it('should make a GET request to /cases/:crn using user token and return the response body', async () => {
    const caseData = caseFactory.build()
    const { crn } = caseData

    await provider.addInteraction({
      state: `Case with CRN ${crn} exists for user`,
      uponReceiving: 'a request to get a user case by CRN',
      withRequest: {
        method: 'GET',
        path: `/cases/${crn}`,
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body: caseData,
      },
    })

    const response = await casesClient.getCase('test-user-token', crn)
    expect(response).toEqual(caseData)
  })

  it('should make a GET request to /application-histories/:crn using user token and return the response body', async () => {
    const referrals = referralFactory.buildList(3)
    const crn = crnFactory()

    await provider.addInteraction({
      state: `Referral history exists for case with CRN ${crn}`,
      uponReceiving: 'a request to get referral history for a user case by CRN',
      withRequest: {
        method: 'GET',
        path: `/application-histories/${crn}`,
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body: referrals,
      },
    })

    const response = await casesClient.getReferralHistory('test-user-token', crn)
    expect(response).toEqual(referrals)
  })
})
