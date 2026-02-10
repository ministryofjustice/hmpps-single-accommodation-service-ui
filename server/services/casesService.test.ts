import { GetCasesQuery } from '@sas/ui'
import CasesClient from '../data/casesClient'
import CasesService from './casesService'
import { caseFactory } from '../testutils/factories'

jest.mock('../data/casesClient')

describe('CasesService', () => {
  const casesClient = new CasesClient(null) as jest.Mocked<CasesClient>
  let casesService: CasesService

  const token = 'test-user-token'

  beforeEach(() => {
    casesService = new CasesService(casesClient)
  })

  it('should call getCases on the api client with the correct parameters and return cases', async () => {
    const cases = caseFactory.buildList(3)

    casesClient.getCases.mockResolvedValue(cases)

    const query: GetCasesQuery = { searchTerm: 'foo', assignedTo: 'user-id-1' }

    const result = await casesService.getCases(token, query)

    expect(casesClient.getCases).toHaveBeenCalledWith(token, query)
    expect(result).toEqual(cases)
  })
})
