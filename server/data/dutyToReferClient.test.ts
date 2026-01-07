import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import describeClient from '../testutils/describeClient'
import DutyToReferClient from './dutyToReferClient'
import { dutyToReferFactory } from '../testutils/factories'
import apiPaths from '../paths/api'
import crnFactory from '../testutils/crn'

describeClient('DutyToReferClient', provider => {
  let dutyToReferClient: DutyToReferClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    dutyToReferClient = new DutyToReferClient(mockAuthenticationClient)
  })

  it('should make a GET request to /cases/:crn/dutyToRefer using user token and return the response body', async () => {
    const dutyToRefer = [dutyToReferFactory.build()]
    const crn = crnFactory()

    await provider.addInteraction({
      state: `DutyToRefer exists for case with CRN ${crn}`,
      uponReceiving: 'a request to get dutyToRefer for a user case by CRN',
      withRequest: {
        method: 'GET',
        path: apiPaths.dutyToRefer({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body: dutyToRefer,
      },
    })

    const response = await dutyToReferClient.getDutyToRefer('test-user-token', crn)
    expect(response).toEqual(dutyToRefer)
  })
})
