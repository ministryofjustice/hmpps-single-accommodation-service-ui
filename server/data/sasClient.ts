import { asUser } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import SasApiClient from './sasApiClient'
import { HelloWorldData } from '../interfaces/helloWorldData'

export default class SasClient extends SasApiClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Single Accommodation Service (SAS) API', authenticationClient)
  }

  getHelloWorld(token: string): Promise<HelloWorldData> {
    return this.get({ path: '/hello-world' }, asUser(token))
  }
}
