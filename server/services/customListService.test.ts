import { GetCasesQuery } from '@sas/ui'
import { ApiResponseDtoListString } from '@sas/api'
import { apiResponseFactory } from '../testutils/factories'
import CustomListClient from '../data/customListClient'
import CustomListService from './customListService'

jest.mock('../data/customListClient')

describe('CustomListService', () => {
  const customListClient = new CustomListClient(null) as jest.Mocked<CustomListClient>
  let customListService: CustomListService

  const token = 'test-user-token'

  beforeEach(() => {
    customListService = new CustomListService(customListClient)
  })

  it('should call getCustomList on the api client and return the custom list for current user', async () => {
    const response = apiResponseFactory.caseList()
    customListClient.getCustomListCases.mockResolvedValue(response)
    const query: GetCasesQuery = { searchTerm: 'foo', riskLevel: 'MEDIUM' }

    const result = await customListService.getCustomListCases(token, query)

    expect(customListClient.getCustomListCases).toHaveBeenCalledWith(token, query)
    expect(result).toEqual(response)
  })
  it('should call getCustomList on the api client and return the list of crns for current user', async () => {
    const response = apiResponseFactory.buildResponse(['CRN1', 'CRN2']) as ApiResponseDtoListString
    customListClient.getCustomListCrns.mockResolvedValue(response)

    const result = await customListService.getCustomListCrns(token)

    expect(customListClient.getCustomListCrns).toHaveBeenCalledWith(token)
    expect(result).toEqual(response)
  })
  it('should call addCustomList on the api client and return the result', async () => {
    const crnList = ['X123456', 'X654321']
    customListClient.addCustomList.mockReturnValue(Promise.resolve(null))

    const result = await customListService.addCustomList(token, crnList)

    expect(customListClient.addCustomList).toHaveBeenCalledWith(token, crnList)
    expect(result).toEqual(null)
  })
})
