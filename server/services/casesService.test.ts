import CasesClient, { CaseSummary } from '../data/casesClient'
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
    const cases = [] as Array<CaseSummary>

    casesClient.getCases.mockResolvedValue({ cases })

    const result = await casesService.getCases(token)

    expect(casesClient.getCases).toHaveBeenCalledWith(token)
    expect(result).toEqual({ cases })
  })
})
