import { AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import apiPaths from '../paths/api'

export default class PrivateAddressClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Private address client', config.apis.sasApi, logger, authenticationClient)
  }

  async submit(token: string, crn: string, privateAddressData: Record<string, unknown>): Promise<void> {
    // TODO connect to api
    console.log(`submit private address for CRN: ${crn}`)
    console.log('private address:', privateAddressData)
    // return this.post<void>({
    //   path: apiPaths.privateAddress.submit({ crn }),
    //   data: privateAddressData,
    // })
  }
}
