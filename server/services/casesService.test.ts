import { CasesResponse } from '@sas/api'
import CasesClient from '../data/casesClient'
import CasesService from './casesService'

jest.mock('../data/casesClient')

describe('CasesService', () => {
  const casesClient = new CasesClient(null) as jest.Mocked<CasesClient>
  let casesService: CasesService

  const token = 'test-user-token'

  beforeEach(() => {
    casesService = new CasesService(casesClient)
  })

  it('should call getCases on the api client and return its result', async () => {
    const casesResponse: CasesResponse = { cases: [] }

    casesClient.getCases.mockResolvedValue(casesResponse)

    const result = await casesService.getCases(token)

    expect(casesClient.getCases).toHaveBeenCalledWith(token)
    expect(result).toEqual(casesResponse)
  })
})
