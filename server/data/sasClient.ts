import { RestClient, asUser } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import { HelloWorldData } from '../interfaces/helloWorldData'

export default class SasClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Single Accommodation Service (SAS) API', config.apis.sasApi, logger, authenticationClient)
  }

  getHelloWorld(token: string): Promise<HelloWorldData> {
    return this.get({ path: '/hello-world' }, asUser(token))
  }
}
