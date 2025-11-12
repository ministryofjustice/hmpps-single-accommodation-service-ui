import SasClient from '../data/sasClient'
import { HelloWorldData } from '../interfaces/helloWorldData'

export default class ExampleService {
  constructor(private readonly sasClient: SasClient) {}

  getHelloWorld(token: string): Promise<HelloWorldData> {
    return this.sasClient.getHelloWorld(token)
  }
}
