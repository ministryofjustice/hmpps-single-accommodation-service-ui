import SasClient from '../data/sasClient'
import ExampleService from './exampleService'

jest.mock('../data/sasClient')

describe('ExampleService', () => {
  const sasClient = new SasClient(null) as jest.Mocked<SasClient>
  let exampleService: ExampleService

  beforeEach(() => {
    exampleService = new ExampleService(sasClient)
  })

  it('should call getHelloWorld on the api client and return its result', async () => {
    const expectedResponse = {
      message: 'Hello world',
    }
    sasClient.getHelloWorld.mockResolvedValue(expectedResponse)

    const result = await exampleService.getHelloWorld('some token')

    expect(sasClient.getHelloWorld).toHaveBeenCalledTimes(1)
    expect(result).toEqual(expectedResponse)
  })
})
