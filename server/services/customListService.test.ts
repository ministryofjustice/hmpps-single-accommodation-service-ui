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
    customListClient.getCustomList.mockResolvedValue(response)

    const result = await customListService.getCustomList(token)

    expect(customListClient.getCustomList).toHaveBeenCalledWith(token)
    expect(result).toEqual(response)
  })
  it('should call addCustomList on the api client and return the result', async () => {
    const response = apiResponseFactory.build()
    const crnList = ['X123456', 'X654321']
    customListClient.addCustomList.mockReturnValue(Promise.resolve(null))

    const result = await customListService.addCustomList(token, crnList)

    expect(customListClient.addCustomList).toHaveBeenCalledWith(token, crnList)
    expect(result).toEqual(null)
  })
})
