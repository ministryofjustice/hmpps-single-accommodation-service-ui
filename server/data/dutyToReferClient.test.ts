import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { faker } from '@faker-js/faker/locale/en'
import describeClient from '../testutils/describeClient'
import DutyToReferClient from './dutyToReferClient'
import { apiResponseFactory, dtrCommandFactory, dutyToReferFactory } from '../testutils/factories'
import apiPaths from '../paths/api'
import crnFactory from '../testutils/crn'

describeClient('DutyToReferClient', provider => {
  let dutyToReferClient: DutyToReferClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    dutyToReferClient = new DutyToReferClient(mockAuthenticationClient)
  })

  it('should make a GET request to /cases/:crn/dtr using user token and return the response body', async () => {
    const body = apiResponseFactory.dutyToRefer()
    const crn = crnFactory()

    await provider.addInteraction({
      state: `DutyToRefer exists for case with CRN ${crn}`,
      uponReceiving: 'a request to get the current Duty to refer for a user case by CRN',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.dutyToRefer.current({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await dutyToReferClient.getCurrentDtr('test-user-token', crn)
    expect(response).toEqual(body)
  })

  it('should make a GET request to /cases/:crn/dtr/:id using user token and return the response body', async () => {
    const dutyToRefer = dutyToReferFactory.submitted().build()
    const body = apiResponseFactory.dutyToRefer(dutyToRefer)
    const {
      data: {
        crn,
        submission: { id },
      },
    } = body

    await provider.addInteraction({
      state: `DutyToRefer exists for submission ID ${id}`,
      uponReceiving: 'a request to get the a Duty to refer by CRN and submission ID',
      withRequest: {
        method: 'GET',
        path: apiPaths.cases.dutyToRefer.show({ crn, id }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
      },
      willRespondWith: {
        status: 200,
        body,
      },
    })

    const response = await dutyToReferClient.getDtrBySubmissionId('test-user-token', crn, id)
    expect(response).toEqual(body)
  })

  it('should make a POST request to /cases/:crn/dtr with data and return 200', async () => {
    const crn = crnFactory()
    const command = dtrCommandFactory.build()

    await provider.addInteraction({
      state: `DutyToRefer can be submitted for case with CRN ${crn}`,
      uponReceiving: 'a request to submit dutyToRefer for a user case by CRN',
      withRequest: {
        method: 'POST',
        path: apiPaths.cases.dutyToRefer.submit({ crn }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
        body: command,
      },
      willRespondWith: {
        status: 201,
      },
    })

    await dutyToReferClient.submit('test-user-token', crn, command)
  })

  it('should make a PUT request to /cases/:crn/dtr/:id with data and return 200', async () => {
    const crn = crnFactory()
    const id = faker.string.uuid()
    const command = dtrCommandFactory.build()

    await provider.addInteraction({
      state: `DutyToRefer can be updated for case with CRN ${crn}`,
      uponReceiving: 'a request to update dutyToRefer for a user case by CRN and id',
      withRequest: {
        method: 'PUT',
        path: apiPaths.cases.dutyToRefer.update({ crn, id }),
        headers: {
          authorization: 'Bearer test-user-token',
        },
        body: command,
      },
      willRespondWith: {
        status: 200,
      },
    })

    await dutyToReferClient.update('test-user-token', crn, id, command)
  })
})
